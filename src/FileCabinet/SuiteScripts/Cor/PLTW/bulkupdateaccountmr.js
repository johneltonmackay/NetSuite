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
            let arrActiveAccounts = [];
            try {
                let objAccountSearch = search.create({
                    type: 'customer',
                    filters: [
                        ['category', 'noneof', '6'],
                        'AND',
                        ['stage', 'anyof', 'CUSTOMER'],
                        'AND',
                        ['address.internalid', 'noneof', '@NONE@'],
                        'AND',
                        ['isinactive', 'is', 'F'],
                        // 'AND',
                        // ['internalid', 'anyof', '451353', '535702', '2264245'],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                        search.createColumn({name: 'addressinternalid', join: 'Address'}),
                    ],

                });
                var searchResultCount = objAccountSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objAccountSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrActiveAccounts.push({
                                    customerId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    addressId: pageData[pageResultIndex].getValue({
                                        name: 'addressinternalid',
                                        join: 'Address'
                                    }),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err);
            }
            log.debug("getInputData: arrActiveAccounts", arrActiveAccounts)
            return arrActiveAccounts;

        }

        const map = (mapContext) => {
            log.debug('map : mapContext', mapContext);
            let objMapValue = JSON.parse(mapContext.value)
            let intAddressId = objMapValue.addressId
            let intCustomerId = objMapValue.customerId
            log.debug('intAddressId', intAddressId)
            if (intAddressId) {
                let customRecordId = searchAVAENTITYUSEMAPPING(intAddressId)
                if (customRecordId.length > 0) {
                    updateFinancial(intCustomerId)
                } else {
                    var rec = record.create({
                        type: 'customrecord_avaentityusemapping_new',
                        isDynamic: true
                    });

                    rec.setValue({
                        fieldId: 'custrecord_ava_customerid_new',
                        value: intCustomerId
                    });

                    rec.setValue({
                        fieldId: 'custrecord_ava_addressid_new',
                        value: intAddressId
                    });

                    rec.setValue({
                        fieldId: 'custrecord_ava_custinternalid',
                        value: intCustomerId
                    });

                    rec.setValue({
                        fieldId: 'custrecord_ava_entityusemap_new',
                        value: 13 // M
                    });

                    let newEntityMappingId = rec.save();
                    log.debug("newEntityMappingId", newEntityMappingId)
                    updateFinancial(intCustomerId)
                }
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        //PRIVATE FUNCTION

        function searchAVAENTITYUSEMAPPING(intAddressId) {
            let arrAvaInternalId = [];
            try {
                let objAVASearch = search.create({
                    type: 'customrecord_avaentityusemapping_new',
                    filters: [
                        ['custrecord_ava_addressid_new', 'is', intAddressId],
                    ],
                    columns: [
                        search.createColumn({name: 'internalid'}),
                    ],
                });
                var searchResultCount = objAVASearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objAVASearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrAvaInternalId.push({
                                    avaInternalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err);
            }
            log.debug("searchAVAENTITYUSEMAPPING: arrAvaInternalId", arrAvaInternalId)
            return arrAvaInternalId;
        }

        function updateFinancial(intCustomerId) {

            let recCustomer = record.load({
                type: record.Type.CUSTOMER,
                id: intCustomerId,
                isDynamic: true,
            });

            var numLines = recCustomer.getLineCount({
                sublistId: 'addressbook'
            });
            if (numLines) {
                recCustomer.selectLine({
                    sublistId: 'addressbook',
                    line: 0
                });
                let entityUseCode = recCustomer.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'custpage_ava_entityusecode',
                });
                log.debug("updateFinancial: entityUseCode", entityUseCode);

                recCustomer.setValue({
                    fieldId: 'custentity_useentitycodes',
                    value: entityUseCode
                });

                let newEntityCode = recCustomer.getValue({
                    fieldId: 'custentity_useentitycodes',
                });

                let customerRecId = recCustomer.save();

                log.debug("newEntityCode", newEntityCode)
                log.debug("customerRecId updated", customerRecId)

            }
        }

        return {getInputData, map, reduce, summarize}

    });
