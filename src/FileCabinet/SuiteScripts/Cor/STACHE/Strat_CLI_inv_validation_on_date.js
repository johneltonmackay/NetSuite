/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/format', 'N/ui/dialog'],
    function (currentRecord, record, format, dialog) {
        var s_Type;

        function pageInit(scriptContext) {
            console.log("pageInit: TEST2")
        }

        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var strFieldChanging = context.fieldId
            console.log(strFieldChanging)
            if (strFieldChanging === 'custcoladm_rev_rec_end') {
                var rev_start_date = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcoladm_rev_rec_start'
                })
                var rev_end_date = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcoladm_rev_rec_end'
                })
                var d_start_date_updated, d_end_date_updated;

                if (rev_start_date)
                    d_start_date_updated = format.format({value: rev_start_date, type: format.Type.DATE});

                if (rev_end_date)
                    d_end_date_updated = format.format({value: rev_end_date, type: format.Type.DATE});

                if (rev_start_date && rev_end_date) {
                    if (rev_end_date < rev_start_date) {
                        // alert('End date: '+ d_end_date_updated +' must be greater than Start date: '+ d_start_date_updated + '.')
                        let options = {
                            title: 'Invalid End Date: ' + d_end_date_updated,
                            message: 'You cannot enter an end date prior to the start date.'
                        };
                        dialog.alert(options)
                        currentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcoladm_rev_rec_end',
                            value: ''
                        });
                    }
                }
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };
    });