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
            console.log("pageInit", "TEST1")
            var currRecord = scriptContext.currentRecord;
            let intAracct = currRecord.getValue({
                fieldId: 'aracct'
            });
            console.log('intAracct', intAracct)

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

            currRecord.setValue({
                fieldId: 'trandate',
                value: txnDate,
            });

            currRecord.setValue({
                fieldId: 'aracct',
                value: 360,
            });

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
            console.log("fieldChanged", "TEST")

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
            let txnMemo = "C-70006071893";
            let txnAmount = 100;
            var strFieldChanging = scriptContext.fieldId;
            console.log("postSourcing", strFieldChanging)
            var currRecord = scriptContext.currentRecord;
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
                        var invRec = search.lookupFields({
                            type: search.Type.INVOICE,
                            id: invoiceId,
                            columns: ['createdfrom', 'amount']
                        });
                        var soTranNum = invRec.createdfrom[0].text.split('#')[1];
                        console.log('soTranNum', soTranNum)
                        if (soTranNum === txnMemo) {
                            invoiceRecords[invoiceId] = invRec.amount;
                        }

                    }
                    var invoiceIdsOrdered = Object.keys(invoiceRecords).sort();
                    console.log('invoiceIdsOrdered', invoiceIdsOrdered)
                }

            }

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {
            console.log("sublistChanged", "TEST")

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            console.log("lineInit", "TEST")


        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

            // console.log('invoiceRecords ', JSON.stringify(invoiceRecords));


            // sort invoice ids from oldest internal id first
            // var invoiceIdsOrdered = Object.keys(invoiceRecords).sort();
            // // console.log('invoiceIdsOrdered ', JSON.stringify(invoiceIdsOrdered));
            //
            // var invToApply = [];
            //
            // // compare invoice amount to customer deposit amount to apply enough
            // for (var i = 0; invoiceIdsOrdered && i < invoiceIdsOrdered.length; i++) {
            //     var invId = invoiceIdsOrdered[i];
            //     var invoiceAmt = parseFloat(invoiceRecords[invId]);
            //     if (invoiceAmt <= txnAmount) {
            //         invToApply.push(invId)
            //         txnAmount -= invoiceAmt;
            //     } else {
            //         invToApply.push(invId);
            //         break;
            //     }
            //
            //     if (txnAmount == 0) {
            //         break;
            //     }
            // }
            // // apply invoices listed above
            //
            // for (var k = 0; k < invoiceIdsOrdered.length; k++) {
            //     let id = invoiceIdsOrdered[k];
            //     // console.log("Array", invoiceId)
            //     var lineNumber = currRecord.findSublistLineWithValue({
            //         sublistId: 'apply',
            //         fieldId: 'internalid',
            //         value: id
            //     });
            //     // console.log("lineNumber", lineNumber)
            //     currRecord.selectLine({
            //         sublistId: 'apply',
            //         line: lineNumber
            //     });
            //     currRecord.setCurrentSublistValue({
            //         sublistId: 'apply',
            //         fieldId: 'apply',
            //         value: true,
            //         // ignoreFieldChange: true
            //         // forceSyncSourcing: false,
            //
            //
            //     });
            //     currRecord.commitLine({
            //         sublistId: 'apply'
            //     });
            // }
            // document.getElementById('submitter').click();=

            return true
        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            console.log("validateLine", "TEST")
            return true
        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {
            console.log("validateInsert", "TEST")
            return true
        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {
            console.log("validateDelete", "TEST")
            return true

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            console.log("saveRecord", "TEST")
            return true
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
