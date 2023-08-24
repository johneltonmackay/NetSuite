/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/error', 'N/search', 'N/record', 'N/currentRecord'], function (error, search, record, currentRecord) {
    function pageInit(context) {
        console.log('test');
        var currentRecord = context.currentRecord;
        var recordType = currentRecord.type;
        console.log('recordtype', recordType);
        // if (recordType === 'salesorder'){
        //     var lineNumber = currentRecord.findSublistLineWithValue({
        //         sublistId: 'links',
        //         fieldId: 'linkurl',
        //         value: "/app/accounting/transactions/custinvc.nl?whence="
        //     });
        //     console.log('lineNumber', lineNumber);
        //     let invoiceId = currentRecord.getSublistValue({
        //         sublistId: 'links',
        //         fieldId: 'id',
        //         line: lineNumber
        //     });
        //
        //     console.log('invoiceId', invoiceId);
        //
        //     let arrInvoiceData = [];
        //     let objInvSearch = search.create({
        //         type: 'invoice',
        //         filters: [
        //             ['type', 'anyof', 'CustInvc'],
        //             'AND',
        //             ['internalid', 'anyof', invoiceId],
        //             'AND',
        //             ['mainline', 'is', 'F'],
        //             'AND',
        //             ['custcoladm_rev_rec_end', 'isnotempty', ''],
        //             'AND',
        //             ['custcoladm_rev_rec_start', 'isnotempty', ''],
        //         ],
        //         columns: ['custcoladm_rev_rec_end', 'custcoladm_rev_rec_start'],
        //     });
        //     objInvSearch.run().each(function (result) {
        //         arrInvoiceData.push({
        //             'revstart': result.getValue('custcoladm_rev_rec_start'),
        //             'revend': result.getValue('custcoladm_rev_rec_end'),
        //         });
        //         return true;
        //     });
        //     console.log('arrInvoiceData', arrInvoiceData);
        //     const revStartDate = new Date(arrInvoiceData[0].revstart);
        //     const revEndDate = new Date(arrInvoiceData[0].revend);
        //     currentRecord.setValue({
        //         fieldId: 'startdate',
        //         value: revStartDate
        //     });
        //     currentRecord.setValue({
        //         fieldId: 'enddate',
        //         value: revEndDate
        //     });
        // } else {
        if (context.mode === 'create') {
            var today = new Date();

            currentRecord.setValue({
                fieldId: 'startdate',
                value: today
            });
            currentRecord.setValue({
                fieldId: 'enddate',
                value: today
            });
        }
        // }
    }

    function validateLine(context) {
        var currentRecord = context.currentRecord;
        var rSDate = currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcoladm_rev_rec_start'
        });
        var rEDate = currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcoladm_rev_rec_end'
        });
        var iClass = currentRecord.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'class'
        });
        var bSDate = currentRecord.getValue({fieldId: 'startdate'});
        var bEDate = currentRecord.getValue({fieldId: 'enddate'});

        if (iClass === '1' || iClass === '20') {
            console.log('class 1 || 20');
            console.log('bSDate ' + bSDate);
            console.log('bEDate ' + bEDate);
            if (rSDate === "") {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_start',
                    value: bSDate
                });
            }
            if (rEDate === "") {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_end',
                    value: bSDate
                });
            }
        }
        if (iClass === '17' || iClass === '18') {
            console.log('class 17 || 18');
            console.log('bSDate ' + bSDate);
            console.log('bEDate ' + bEDate);
            if (rSDate === "") {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_start',
                    value: bSDate
                });
            }
            if (rEDate === "") {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_end',
                    value: bEDate
                });
            }
        }
        return true;
    }

    function fieldChanged(context) {
        var fieldName = context.fieldId;
        var currentRecord = context.currentRecord;

        // update transaction lines
        if (fieldName === 'startdate' || fieldName === 'enddate') {
            var bSDate = currentRecord.getValue({fieldId: 'startdate'});
            var bEDate = currentRecord.getValue({fieldId: 'enddate'});
            var numLines = currentRecord.getLineCount({sublistId: 'item'});

            for (var i = 0; i < numLines; i++) {
                var selLine = currentRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });
                var rSDate = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_start'
                });
                var rEDate = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcoladm_rev_rec_end'
                });
                var iClass = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'class'
                });

                if (iClass === '1' || iClass === '20') {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_start',
                        value: bSDate
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_end',
                        value: bSDate
                    });
                } else if (iClass === '17' || iClass === '18') {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_start',
                        value: bSDate
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_end',
                        value: bEDate
                    });
                }
                currentRecord.commitLine({sublistId: 'item'});
            }
        } else if (fieldName === 'entity') {
            currentRecord.setValue({
                fieldId: 'department',
                value: '48'
            });
        }
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        fieldChanged: fieldChanged
    };
});