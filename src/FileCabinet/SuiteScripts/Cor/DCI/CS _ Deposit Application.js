/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/currentRecord'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     * @param{currentRecord} currentRecord
     */
    function (record, search, runtime, currentRecord) {

        function pageInit(scriptContext) {
            console.log("pageInit", "TEST1")
            var currRecord = scriptContext.currentRecord;
            let depAppId = currRecord.getValue({
                fieldId: 'id'
            });
            console.log("depAppId", depAppId)

            if (depAppId === ""){
                let intAracct = currRecord.getValue({
                    fieldId: 'aracct'
                });
                console.log('intAracct', intAracct)

                var depostData = loadDepositRecord(scriptContext)
                currRecord.setValue({
                    fieldId: 'trandate',
                    value: depostData.txnDate,
                });

                currRecord.setValue({
                    fieldId: 'aracct',
                    value: 360,
                });
            }

        }

        function postSourcing(scriptContext) {
            var currRecord = scriptContext.currentRecord;
            let depAppId = currRecord.getValue({
                fieldId: 'id'
            });
            if (depAppId === ""){
                var depostData = loadDepositRecord(scriptContext)
                let txnMemo = depostData.txnMemo;
                let txnAmount = depostData.txnAmount;
                var strFieldChanging = scriptContext.fieldId;
                console.log("postSourcing", strFieldChanging)
                var strFieldChanging = scriptContext.fieldId;
                if (strFieldChanging === 'aracct') {
                    var numLines = currRecord.getLineCount({
                        sublistId: 'apply'
                    });
                    console.log('numLines', numLines)
                    if (numLines) {
                        var invoiceRecords = {};
                        for (var j = 0; j < numLines; j++) {
                            var invoiceId = currRecord.getSublistValue('apply', 'internalid', j);
                            console.log('invoiceId', invoiceId)
                            var invRec = search.lookupFields({
                                type: search.Type.INVOICE,
                                id: invoiceId,
                                columns: ['createdfrom', 'amount', 'duedate']
                            });
                            var soTranNum = invRec.createdfrom[0].text.split('#')[1];
                            console.log('soTranNum', soTranNum)
                            if (soTranNum === txnMemo) {
                                invoiceRecords[invoiceId] = {
                                    'duedate': invRec.duedate,
                                    'amount': invRec.amount,
                                };
                            }

                        }
                        console.log('invoiceRecords', invoiceRecords)
                        var invoiceIdsOrdered = Object.keys(invoiceRecords).sort(function (a, b) {
                            var dueDateA = new Date(invoiceRecords[a].duedate);
                            var dueDateB = new Date(invoiceRecords[b].duedate);
                            return dueDateA - dueDateB;
                        });
                        console.log('invoiceIdsOrdered', invoiceIdsOrdered)

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
                            var lineNumber = currRecord.findSublistLineWithValue({
                                sublistId: 'apply',
                                fieldId: 'internalid',
                                value: id
                            });
                            console.log('lineNumber', lineNumber)

                            currRecord.insertLine({
                                sublistId: 'apply',
                                line: lineNumber
                            });
                            currRecord.setCurrentSublistValue({
                                sublistId: 'apply',
                                fieldId: 'apply',
                                value: true,
                            });
                            currRecord.commitLine({
                                sublistId: 'apply'
                            });
                        }
                        document.getElementById('submitter').click();
                    }
                }

            }
        }

        //PRIVATE FUNCTION

        function loadDepositRecord(scriptContext) {
            var currRecord = scriptContext.currentRecord;
            let intId = currRecord.getValue({
                fieldId: 'deposit'
            });
            console.log('intId', intId)
            var objRecord = record.load({
                type: record.Type.CUSTOMER_DEPOSIT,
                id: intId,
                isDynamic: true,
            });
            let txnDate = objRecord.getValue({
                fieldId: 'trandate'
            });

            let txnMemo = objRecord.getValue({
                fieldId: 'memo'
            });
            console.log('txnMemo', txnMemo)

            let txnAmount = objRecord.getValue({
                fieldId: 'payment'
            });
            console.log('txnAmount', txnAmount)
            let data = {
                txnDate: txnDate,
                txnMemo: txnMemo,
                txnAmount: txnAmount
            }
            return data
        }
        return {
            pageInit: pageInit,
            postSourcing: postSourcing,
        };

    });
