/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        const afterSubmit = (scriptContext) => {
            let intClassValue
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                var objNewRecord = scriptContext.newRecord;
                var strId = objNewRecord.id;
                log.debug("strId", strId)
                var strRecType = objNewRecord.type
                log.debug("strRecType", strRecType)
                var objRecord = record.load({
                    type: strRecType,
                    id: strId,
                    isDynamic: true,
                });
                var numLines = objRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug("numLines", numLines)

                for (let x = 0; x < numLines; x++) {
                    var intShipRate
                    var intAmount
                    if (strRecType == 'itemfulfillment') {
                        let createdFromId = objNewRecord.getValue({
                            fieldId: 'createdfrom',
                        })
                        var ordLine = objNewRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline',
                            line: x
                        });
                        log.debug("createdFromId", createdFromId)
                        log.debug("ordLine", ordLine)
                        intClassValue = getClassIF(createdFromId, ordLine, x)

                    } else {
                        intShipRate = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_cc_shippingcharge',
                            line: x
                        })
                        intAmount = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: x
                        })
                        log.debug("intShipRate", intShipRate)
                        log.debug("intAmount", intAmount)
                        if (intAmount > 0) {
                            if (intShipRate || !intShipRate) {
                                intClassValue = 3 // PAID
                            }
                        } else {
                            if (intShipRate > 0) {
                                intClassValue = 2 // FREE
                            } else {
                                intClassValue = 1 // COMP
                            }
                        }
                    }
                    log.debug("intClassValue for Line " + x, intClassValue);
                    objRecord.selectLine({
                        sublistId: 'item',
                        line: x
                    });
                    objRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'class',
                        value: intClassValue
                    })
                    objRecord.commitLine({
                        sublistId: 'item'
                    });
                }
                var recordId = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                log.debug("recordId Updated ", recordId);
            }
        }

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
            log.debug("getClassIF intAmount", intAmount)
            log.debug("getClassIF intShipRate", intShipRate)
            var intClassValue
            if (intAmount > 0) {
                if (intShipRate || !intShipRate) {
                    intClassValue = 3 // PAID
                }
            } else {
                if (intShipRate > 0) {
                    intClassValue = 2 // FREE
                } else {
                    intClassValue = 1 // COMP
                }
            }
            log.debug("intClassValue for Line getClassIF" + x, intClassValue);
            return intClassValue

        }

        return {afterSubmit}

    }
)
;
