/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        const getInputData = (inputContext) => {
            let arrRevPlan = [];
            try {
                let objRevPlanSearch = search.create({
                    type: 'revenueplan',
                    filters: [
                        ['revenueelement.subsidiary', 'anyof', '2'],
                        'AND',
                        ['plannedperiod', 'anyof', '54', '55'],
                        'AND',
                        ['isrecognized', 'is', 'F'],
                        // 'AND',
                        // ['plannedperiod', 'anyof', '24', '58', '29', '63', '34', '68', '21', '55', '20', '54', '28', '62', '26', '60', '22', '56', '25', '59', '33', '67', '32', '66', '30', '64'],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                    ],

                });
                var searchResultCount = objRevPlanSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objRevPlanSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrRevPlan.push({
                                    revPlanId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err);
            }
            // log.debug("getInputData: arrRevPlan", arrRevPlan)
            return arrRevPlan;

        }

        const map = (mapContext) => {
            // log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
            let intRevPlanId = objMapValue.revPlanId
            log.debug('intRevPlanId', intRevPlanId)
            if (intRevPlanId) {
                let objRecRevPlan = record.load({
                    type: record.Type.REVENUE_PLAN,
                    id: intRevPlanId,
                    isDynamic: true,
                });

                var numLines = objRecRevPlan.getLineCount({
                    sublistId: 'plannedrevenue'
                });
                log.debug('numLines', numLines)
                if (numLines) {
                    for (var x = 0; x < numLines; x++) {
                        objRecRevPlan.selectLine({
                            sublistId: 'plannedrevenue',
                            line: x
                        });
                        let strPlanPeriod = objRecRevPlan.getCurrentSublistText({
                            sublistId: 'plannedrevenue',
                            fieldId: 'plannedperiod',
                        });

                        if (strPlanPeriod.includes("Jan 2019") || strPlanPeriod.includes("Feb 2019")){
                            log.debug('strPlanPeriod', strPlanPeriod)
                            objRecRevPlan.setCurrentSublistValue({
                                sublistId: 'plannedrevenue',
                                fieldId: 'isrecognized',
                                value: true
                            });
                        }
                        // else {
                        //     objRecRevPlan.setCurrentSublistValue({
                        //         sublistId: 'plannedrevenue',
                        //         fieldId: 'isrecognized',
                        //         value: false
                        //     });
                        // }
                        objRecRevPlan.commitLine({
                            sublistId: 'plannedrevenue'
                        });

                        let revPlanRecId = objRecRevPlan.save();

                        log.debug("revPlanRecId updated", revPlanRecId);
                    }
                }
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
