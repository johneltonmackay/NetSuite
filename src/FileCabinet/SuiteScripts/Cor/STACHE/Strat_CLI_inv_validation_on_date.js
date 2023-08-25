/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/format', 'N/ui/dialog', 'N/search'],
    function (currentRecord, record, format, dialog, search) {
        const allowedCompanies = [
            "Activia Networks Canada Inc.",
            "Stratacache Inc",
            "Stratacache Limited",
            "Scala Asia Pacific",
            "Scala China Sales Corporation",
            "Scala, Inc.",
            "Scala BV",
            "Scala Canada, Inc.",
            "Scala KK",
            "Scala Nordic AS"
        ];
        function pageInit(scriptContext) {
            console.log("pageInit: TEST")
        }

        function fieldChanged(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            var strFieldChanging = scriptContext.fieldId
            if (strFieldChanging === 'custcoladm_rev_rec_end') {
                console.log('fieldChanged', strFieldChanging)
                var rev_start_date = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcoladm_rev_rec_start'
                })
                var rev_end_date = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcoladm_rev_rec_end'
                })
                var d_end_date_updated;

                if (rev_end_date) {
                    d_end_date_updated = format.format({value: rev_end_date, type: format.Type.DATE});
                }
                if (rev_start_date && rev_end_date) {
                    if (rev_end_date < rev_start_date) {
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
            if (sublistName === 'item' && strFieldChanging === 'item'){
                let srtTranDate = currentRecord.getText({
                    fieldId: 'trandate'
                });
                let strSubsidId = currentRecord.getText({
                    fieldId: 'subsidiary'
                });
                var dtTranDate = new Date(srtTranDate);
                if (allowedCompanies.includes(strSubsidId)) {
                    let itemId = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                    });
                    var revRuleSearch = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['revenuerecognitionrule']
                    })
                    console.log("revRuleSearch: ", revRuleSearch);
                    if (revRuleSearch != null){
                        var revResults = revRuleSearch.revenuerecognitionrule;
                        if (revResults != null || revResults != "" || revResults != undefined) {
                            var indxLine = revResults[0];
                            if (indxLine != null) {
                                var revRuleId = revRuleSearch.revenuerecognitionrule[0].value
                                console.log("revRuleId: ", revRuleId);
                                if (revRuleId == '13' || revRuleId == '19'){
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_start',
                                        value: dtTranDate
                                    });
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistName,
                                        fieldId: 'custcoladm_rev_rec_end',
                                        value: dtTranDate
                                    });
                                } else {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_start',
                                        value: ''
                                    });
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: sublistName,
                                        fieldId: 'custcoladm_rev_rec_end',
                                        value: ''
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
        };
    });