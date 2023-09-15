/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/format', 'N/ui/dialog', 'N/search', 'N/ui/message'],
    function (currentRecord, format, dialog, search, message) {
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
            var currentRecord = scriptContext.currentRecord;
            let transType = currentRecord.getValue({
                fieldId: 'transform'
            });
            console.log("pageInit: transType", transType)
            if (transType === 'salesord') {
                let srtTranDate = currentRecord.getText({
                    fieldId: 'trandate'
                });
                let strSubsidId = currentRecord.getText({
                    fieldId: 'subsidiary'
                });
                console.log("pageInit: srtTranDate", srtTranDate)
                if (allowedCompanies.includes(strSubsidId)) {
                    if (srtTranDate) {
                        var dtTranDate = new Date(srtTranDate);
                        processItemLines(currentRecord, dtTranDate);
                    }
                }
            }
        }

        function fieldChanged(scriptContext) {
            var strFieldChanging = scriptContext.fieldId;
            if (strFieldChanging === 'custcoladm_rev_rec_end' || strFieldChanging === 'trandate') {
                validateAndSetDates(scriptContext);
            }
        }

        function processItemLines(currentRecord, dtTranDate) {
            let numLines = currentRecord.getLineCount({
                sublistId: 'item'
            });
            console.log("pageInit: numLines", numLines)
            for (var x = 0; x < numLines; x++) {
                console.log("pageInit: x", x)
                currentRecord.selectLine({
                    sublistId: 'item',
                    line: x
                });
                let itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                });
                console.log("pageInit: itemId", itemId)
                if (itemId > 0) {
                    var revRuleSearch = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['revenuerecognitionrule']
                    });
                    console.log("revRuleSearch: ", revRuleSearch);
                    if (revRuleSearch != null) {
                        var revResults = revRuleSearch.revenuerecognitionrule;
                        if (revResults != null || revResults != "" || revResults != undefined) {
                            var indxLine = revResults[0];
                            if (indxLine != null) {
                                var revRuleId = revRuleSearch.revenuerecognitionrule[0].value;
                                console.log("revRuleId: ", revRuleId);
                                if (revRuleId == '13' || revRuleId == '2' || revRuleId == '1'){
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_start',
                                        value: dtTranDate,
                                    });
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_end',
                                        value: dtTranDate,
                                    });
                                } else {
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_start',
                                        value: '',
                                    });
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_end',
                                        value: '',
                                    });
                                }
                            }
                        }
                    }
                    currentRecord.commitLine({
                        sublistId: 'item'
                    });
                }
            }
        }

        function validateAndSetDates(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            var strFieldChanging = scriptContext.fieldId;
            var rev_start_date = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcoladm_rev_rec_start'
            });
            var rev_end_date = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcoladm_rev_rec_end'
            });

            var d_end_date_updated;
            if (!isNaN(rev_end_date) && rev_end_date) {
                d_end_date_updated = format.format({ value: new Date(rev_end_date), type: format.Type.DATE });
            }

            if (rev_start_date && rev_end_date) {
                if (rev_end_date < rev_start_date) {
                    let options = {
                        title: 'Invalid End Date: ' + d_end_date_updated,
                        message: 'You cannot enter an end date prior to the start date.'
                    };
                    dialog.alert(options)
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_end',
                        value: ''
                    });
                }
            }

            if (sublistName === 'item' && strFieldChanging === 'item') {
                let srtTranDate = currentRecord.getText({
                    fieldId: 'trandate'
                });
                let strSubsidId = currentRecord.getText({
                    fieldId: 'subsidiary'
                });
                if (allowedCompanies.includes(strSubsidId)) {
                    if (srtTranDate) {
                        var dtTranDate = new Date(srtTranDate);
                        processItemLines(currentRecord, dtTranDate);
                    }
                }
            }
        }

        function saveRecord(scriptContext) {
            var currentRecord = scriptContext.currentRecord;

            var custform = currentRecord.getValue({
                fieldId: 'customform'
            });
            var formExclude = ['344', '134', '139', '260', '319', '131'];
            let counter = 0;
            if (formExclude.indexOf(custform) == -1) {
                let numLines = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                for (var x = 0; x < numLines; x++) {
                    currentRecord.selectLine({
                        sublistId: 'item',
                        line: x
                    });
                    var itemQty = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
                    console.log("itemQty", itemQty)
                    if (itemQty) {
                        var itemType = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype'
                        })
                        console.log("itemType", itemType)
                        if (itemType !== 'Group' && itemType !== 'EndGroup'){
                            var rev_start_date = currentRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcoladm_rev_rec_start'
                            });
                            var rev_end_date = currentRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcoladm_rev_rec_end'
                            });
                            if (!rev_start_date || !rev_end_date) {
                                let myMsg3 = message.create({
                                    title: 'Required Date on Line: ' + (x + 1),
                                    message: 'Please add the Revenue Start and End Date.',
                                    type: message.Type.ERROR,
                                    duration: 50000
                                });
                                myMsg3.show();
                                counter += 1
                            }
                        }
                    }
                }
            }
            return counter < 1;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });
