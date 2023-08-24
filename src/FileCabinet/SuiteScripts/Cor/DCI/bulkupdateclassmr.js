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
            let arrTransaction = [];
            try {
                let objTransactionSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['type', 'anyof', 'SalesOrd', 'CustInvc', 'ItemShip', 'CustCred'],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['datecreated', 'within', 'thisyear'],
                        'AND',
                        ['status', 'noneof', 'CustInvc:B', 'SalesOrd:G', 'CustCred:B'],
                        'AND',
                        ['internalid', 'anyof', '10757772', '10756463', '9749052', '10678644'],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                        search.createColumn({ name: 'type' }),
                    ],

                });
                var searchResultCount = objTransactionSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objTransactionSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrTransaction.push({
                                    transId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    transType: pageData[pageResultIndex].getText({name: 'type'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err);
            }
            log.debug("getInputData: arrTransaction", arrTransaction)
            return arrTransaction;
        }
        const map = (mapContext) => {
            // log.debug("map: arrTransaction", mapContext)
            let objMapValue = JSON.parse(mapContext.value)
            let strId = objMapValue.transId
            let strRecType = objMapValue.transType.toLowerCase().replace(/ /g, '');
            updateClass(strRecType, strId)


        }

        const reduce = (reduceContext) => {

        }


        const summarize = (summaryContext) => {

        }

        //PRIVATE FUNCTION
        function getClassIF(createdFromId, ordLine, x) {
            var searchTransType = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: createdFromId,
                columns: 'type'
            });
            let transType = searchTransType.type[0].value
            log.debug('transactionType getClassIF:', transType);
            var transactionType = '';
            if (transType === 'SalesOrd') {
                transactionType = 'salesorder';
            } else if (transType === 'VendAuth') {
                transactionType = 'vendorreturnauthorization';
            } else if (transType === 'TrnfrOrd') {
                transactionType = 'transferorder';
            }

            var searchTransaction = search.create({
                type: transactionType,
                filters: [
                    ['internalid', 'anyof', createdFromId],
                    'AND',
                    ['line', 'equalto', ordLine]
                ],
                columns: ['amount', 'custcol_cc_shippingcharge']
            });

            var searchResults = searchTransaction.run().getRange({start: 0, end: 1});

            var intAmount = searchResults[0].getValue({name: 'amount'});
            var intShipRate = searchResults[0].getValue({name: 'custcol_cc_shippingcharge'});
            var intClassValue
            if (intAmount) {
                if (intShipRate || !intShipRate) {
                    intClassValue = 3 // PAID
                }
            } else {
                if (intShipRate) {
                    intClassValue = 2 // FREE
                } else {
                    intClassValue = 1 // COMP
                }
            }
            log.debug("intClassValue for Line getClassIF" + x, intClassValue);
            return intClassValue
        }

        function updateClass(strRecType, strId) {
            // log.debug("strRecType", strRecType)
            // log.debug("strId", strId)
            let intClassValue
            let recTransaction = record.load({
                type: strRecType,
                id: strId,
                isDynamic: true,
            });

            var numLines = recTransaction.getLineCount({
                sublistId: 'item'
            });
            // log.debug("updateClass numLines", numLines);
            for (let x = 0; x < numLines; x++) {
                var intShipRate
                var intAmount
                if (strRecType == 'ITEM_FULFILLMENT') {
                    let createdFromId = recTransaction.getValue({
                        fieldId: 'createdfrom',
                    })
                    var ordLine = recTransaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'orderline',
                        line: x
                    });
                    log.debug("createdFromId", createdFromId)
                    log.debug("ordLine", ordLine)
                    intClassValue = getClassIF(createdFromId, ordLine, x)

                } else {
                    intShipRate = recTransaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_cc_shippingcharge',
                        line: x
                    })
                    intAmount = recTransaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: x
                    })
                    log.debug("intShipRate", intShipRate)
                    log.debug("intAmount", intAmount)
                    if (intAmount) {
                        if (intShipRate || !intShipRate) {
                            intClassValue = 3 // PAID
                        }
                    } else {
                        if (intShipRate) {
                            intClassValue = 2 // FREE
                        } else {
                            intClassValue = 1 // COMP
                        }
                    }
                }
                log.debug("intClassValue for Line " + x, intClassValue);
                recTransaction.selectLine({
                    sublistId: 'item',
                    line: x
                });
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'class',
                    value: intClassValue
                })
                recTransaction.commitLine({
                    sublistId: 'item'
                });
            }
            var recordId = recTransaction.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug("recordId Updated ", recordId);
        }

        return {getInputData, map, reduce, summarize}

    });
