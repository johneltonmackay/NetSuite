/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
//Not deployed
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    const afterSubmit = (context) => {
        try {
            log.debug("CONTEXT: ", context.type);

            if (context.type === context.UserEventType.CREATE) {
                var newRecord = context.newRecord;
                var strId = newRecord.id
                var objRecord = record.load({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    id: strId,
                    isDynamic: true,
                });

                var txnStatus = objRecord.getValue({
                    fieldId: 'status'
                });
                log.debug('txnStatus', txnStatus);
                var txnID = objRecord.getValue({
                    fieldId: 'tranid'
                })

                if (txnID.indexOf('PMT') == 0) {
                    if (txnStatus == 'Not Deposited' || txnStatus == 'Deposited') {
                        log.debug('Create Deposit Application for Customer Deposit:', strId);

                        let txnDate = objRecord.getValue({
                            fieldId: 'trandate'
                        });

                        let txnMemo = objRecord.getValue({
                            fieldId: 'memo'
                        });

                        log.debug('Customer Deposit Memo: ', txnMemo);

                        let txnAmount = objRecord.getValue({
                            fieldId: 'payment'
                        });


                        var depositAppRec = record.transform({
                            fromType: 'customerdeposit',
                            fromId: strId,
                            toType: 'depositapplication',
                            isDynamic: true
                        });

                        depositAppRec.setValue({
                            fieldId: 'trandate',
                            value: txnDate,
                            ignoreFieldChange: true
                        });

                        depositAppRec.setValue({
                            fieldId: 'aracct',
                            value: 360,
                            ignoreFieldChange: false
                        });

                        var numLines = depositAppRec.getLineCount({
                            sublistId: 'apply'
                        });

                        log.debug('numLines: ', numLines);

                        if (numLines) {
                            var invoiceRecords = {};
                            for (var j = 0; j < numLines; j++) {
                                var invoiceId = depositAppRec.getSublistValue('apply', 'internalid', j);
                                var invRec = search.lookupFields({
                                    type: search.Type.INVOICE,
                                    id: invoiceId,
                                    columns: ['createdfrom', 'amount', 'duedate']
                                });
                                var soTranNum = invRec.createdfrom[0].text.split('#')[1];
                                if (soTranNum === txnMemo) {
                                    invoiceRecords[invoiceId] = {
                                        'duedate': invRec.duedate,
                                        'amount': invRec.amount,
                                        'soTranNum': soTranNum
                                    };
                                }
                            }
                            log.debug('invoiceRecords ', JSON.stringify(invoiceRecords));

                            var invoiceIdsOrdered = Object.keys(invoiceRecords).sort(function (a, b) {
                                var dueDateA = new Date(invoiceRecords[a].duedate);
                                var dueDateB = new Date(invoiceRecords[b].duedate);
                                return dueDateA - dueDateB;
                            });
                            log.debug('invoiceIdsOrdered ', JSON.stringify(invoiceIdsOrdered));

                            let invToApply = [];

                            for (var i = 0; invoiceIdsOrdered && i < invoiceRecords.length; i++) {
                                var invId = invoiceIdsOrdered[i];
                                var invoiceAmt = parseFloat(invoiceRecords[invId]);
                                if (invoiceAmt <= txnAmount) {
                                    invToApply.push(invId)
                                    txnAmount -= invoiceAmt;
                                } else {
                                    invToApply.push(invId);
                                    break;
                                }

                                if (txnAmount === 0) {
                                    break;
                                }
                            }

                            for (var k = 0; k < invoiceIdsOrdered.length; k++) {
                                let id = invoiceIdsOrdered[k];
                                var lineNumber = depositAppRec.findSublistLineWithValue({
                                    sublistId: 'apply',
                                    fieldId: 'internalid',
                                    value: id
                                });

                                depositAppRec.selectLine({
                                    sublistId: 'apply',
                                    line: lineNumber
                                });
                                depositAppRec.setCurrentSublistValue({
                                    sublistId: 'apply',
                                    fieldId: 'apply',
                                    value: true,
                                });
                                depositAppRec.commitLine({
                                    sublistId: 'apply'
                                });
                            }

                            var recordId = depositAppRec.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('Deposit Application created. ', recordId);
                        }
                    }

                }
            }
        } catch (e) {
            log.debug("afterSubmit ERROR", e)
        }
    }

    return {afterSubmit}
});
