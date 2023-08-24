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

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            console.log("TEST1")
            // var objCurrentRecord = scriptContext.currentRecord;
            // objCurrentRecord.setValue({
            //     fieldId: 'custbody_cc_testing_transaction',
            //     value: true
            // });

        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {
            var currRecord = scriptContext.currentRecord;
            var strFieldChanging = scriptContext.fieldId;
            let intAracct = currRecord.getValue({
                fieldId: 'aracct'
            });

            console.log('intAracct', intAracct)
            if (strFieldChanging === 'aracct' && intAracct !== 360) {

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

                let txnAmount = objRecord.getValue({
                    fieldId: 'payment'
                });

                currRecord.setValue({
                    fieldId: 'trandate',
                    value: txnDate,
                });

                currRecord.setValue({
                    fieldId: 'aracct',
                    value: 360,
                });
                var numLines = currRecord.getLineCount({
                    sublistId: 'apply'
                });

                // console.log('numLines: ', numLines);

                if (numLines) {
                    var invoiceRecords = {};

                    // get list of invoices that have createdfrom same as customer deposit memo
                    for (var j = 0; j < numLines; j++) {

                        var invoiceId = currRecord.getSublistValue('apply', 'internalid', j);

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
                    // console.log('invoiceRecords ', JSON.stringify(invoiceRecords));


                    // sort invoice ids from oldest internal id first
                    var invoiceIdsOrdered = Object.keys(invoiceRecords).sort();
                    // console.log('invoiceIdsOrdered ', JSON.stringify(invoiceIdsOrdered));

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

                    for (var k = 0; k < invoiceIdsOrdered.length; k++) {
                        let id = invoiceIdsOrdered[k];
                        // console.log("Array", invoiceId)
                        var lineNumber = currRecord.findSublistLineWithValue({
                            sublistId: 'apply',
                            fieldId: 'internalid',
                            value: id
                        });
                        // console.log("lineNumber", lineNumber)
                        currRecord.selectLine({
                            sublistId: 'apply',
                            line: lineNumber
                        });
                        currRecord.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: true,
                            // ignoreFieldChange: true
                            // forceSyncSourcing: false,


                        });
                        currRecord.commitLine({
                            sublistId: 'apply'
                        });
                    }
                    document.getElementById('submitter').click();


                }

            }
        }


        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
        };

    });
