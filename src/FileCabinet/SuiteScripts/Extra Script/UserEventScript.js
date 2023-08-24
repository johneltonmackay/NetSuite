/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
//Not deployed
define(['N/record', 'N/search'], (record, search) => {

    const afterSubmit = (context) => {
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
            log.debug('txnID', txnID);

            if (txnID.indexOf('PMT') == 0 && txnStatus == 'Not Deposited') {
                log.debug('Create Deposit Application for Customer Deposit:', strId);

                let txnDate = objRecord.getValue({
                    fieldId: 'trandate'
                });

                let txnMemo = objRecord.getValue({
                    fieldId: 'memo'
                });

                let txnAmount = objRecord.getValue({
                    fieldId: 'payment'
                });

                var depositAppRec = record.transform({
                    fromType: 'customerdeposit',
                    fromId: strId,
                    toType: 'depositapplication',
                    isDynamic: true
                });

                // setting body fields
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

                    // get list of invoices that have createdfrom same as customer deposit memo
                    for (var j = 0; j < numLines; j++) {
                        depositAppRec.selectLine({
                            sublistId: 'apply',
                            line: j
                        });

                        var invoiceId = depositAppRec.getCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'internalid'
                        });

                        var invRec = search.lookupFields({
                            type: search.Type.INVOICE,
                            id: invoiceId,
                            columns: ['createdfrom', 'amount']
                        });

                        var soTranNum = invRec.createdfrom[0].text.split('#')[1];

                        if (soTranNum == txnMemo) {
                            invoiceRecords[invoiceId] = invRec.amount;
                        }
                    }
                    log.debug('invoiceRecords ', JSON.stringify(invoiceRecords));

                    // sort invoice ids from oldest internal id first
                    var invoiceIdsOrdered = Object.keys(invoiceRecords).sort();
                    log.debug('invoiceIdsOrdered ', JSON.stringify(invoiceIdsOrdered));

                    var invToApply = [];

                    // compare invoice amount to customer deposit amount to apply enough
                    for (var i = 0; invoiceIdsOrdered && i < invoiceIdsOrdered.length; i++) {
                        var invId = invoiceIdsOrdered[i];
                        var invoiceAmt = parseFloat(invoiceRecords[invId]);
                        if (invoiceAmt <= txnAmount) {
                            invToApply.push(invId)
                            txnAmount -= invoiceAmt;
                        } else {
                            invToApply.push(invId);
                            break;
                        }

                        if (txnAmount == 0) {
                            break;
                        }
                    }

                    // apply invoices listed above
                    for (var k = 0; k < numLines; k++) {
                        depositAppRec.selectLine({
                            sublistId: 'apply',
                            line: k
                        });

                        var invoiceId = depositAppRec.getCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'internalid'
                        });

                        log.debug('invoiceId: ', invoiceId);
                        if (invToApply.indexOf(invoiceId) > -1) {
                            depositAppRec.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                value: true
                            });

                            depositAppRec.commitLine({
                                sublistId: 'apply'
                            });
                        }
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

    return {afterSubmit}
});
