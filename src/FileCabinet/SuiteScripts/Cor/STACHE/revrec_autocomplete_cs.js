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