    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     */
    define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/currency'],
        /**
         * @param{record} record
         * @param{search} search
         * @param{serverWidget} serverWidget
         * @param{currency} currency
         */
        (record, search, serverWidget, currency) => {
            const beforeLoad = (scriptContext) => {

            }

            const afterSubmit = (scriptContext) => {
                var newRecord = scriptContext.newRecord;
                var strId = newRecord.id
                var objRecord = record.load({
                    type: record.Type.SALES_ORDER,
                    id: strId,
                    isDynamic: true,
                });
                var numLines = objRecord.getLineCount({sublistId: 'item'});
                log.debug('numLines', numLines)
                if (numLines > 0) {

                    var intCurrency = objRecord.getValue({
                        fieldId: 'currency'
                    });
                    log.debug('intCurrency', intCurrency)
                    var intSubtotal = objRecord.getValue({
                        fieldId: 'subtotal'
                    });
                    log.debug('intSubtotal', intSubtotal)

                    let exRate = getExchangeRate(intCurrency)
                    log.debug("beforeLoad exRate:", exRate)
                    let usdExRate = currency.exchangeRate({
                        source: 'USD',
                        target: 'CAD',
                        date: new Date()
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_usdexrate',
                        value: usdExRate
                    })

                    let amountUSD = 0
                    switch (intCurrency) {
                        case '2': // USD
                            amountUSD = intSubtotal
                            break;
                        case '3': // GBP
                            amountUSD = convertUSD(exRate, intSubtotal)
                            break;
                        case '4': // EUR
                            amountUSD = convertUSD(exRate, intSubtotal)
                            break;
                        case '5': // AUD
                            amountUSD = convertUSD(exRate, intSubtotal)
                            break;
                        case '6': // HKD
                            amountUSD = convertUSD(exRate, intSubtotal)
                            break;
                        case '7': // CNY
                            amountUSD = convertUSD(exRate, intSubtotal)
                            break;
                        default: // CAD
                            amountUSD = intSubtotal / exRate
                            break;
                    }

                    log.debug("amountUSD", amountUSD)

                    objRecord.setValue({
                        fieldId: 'custbody_total_amt_usd',
                        value: amountUSD
                    })

                    var totalCubicFeet = 0;
                    var totalQty = 0;
                    for (let j = 0; j < numLines; j++) {
                        let itemCuFt = parseFloat(objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_item_cuft',
                            line: j
                        })) || 0; // Use 0 if itemCuFt is not available

                        let itemQty = parseInt(objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: j
                        })) || 0; // Use 0 if itemQty is not available

                        log.debug(`Line ${j} - itemCuFt`, itemCuFt);
                        log.debug(`Line ${j} - itemQty`, itemQty);

                        totalCubicFeet += itemCuFt;
                        totalQty += itemQty;

                        log.debug(`Accumulated totalCubicFeet`, totalCubicFeet);
                        log.debug(`Accumulated totalQty`, totalQty);
                    }
                    log.debug("Total calculated totalCubicFeet", totalCubicFeet);
                    log.debug("Total calculated totalQty", totalQty);

                    objRecord.setValue({
                        fieldId: 'custbody_total_cubic_feet',
                        value: totalCubicFeet,
                    });

                    objRecord.setValue({
                        fieldId: 'custbody_total_qty',
                        value: totalQty,
                    });
                    var recordId = objRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('Sales Order Id: ', recordId);
                }
            }

            // PRIVATE FUNCTION

            function getExchangeRate(intCurrency) {
                let exRate = 0
                if (intCurrency == '1' || intCurrency == '2'){
                    exRate = currency.exchangeRate({
                        source: 'USD',
                        target: 'CAD',
                        date: new Date()
                    });
                } else {
                    exRate = currency.exchangeRate({
                        source: intCurrency,
                        target: 'CAD',
                        date: new Date()
                    });
                }

                log.debug("getExchangeRate exRate", exRate)

                return exRate
            }

            function convertUSD(exRate, intSubtotal) {
                let intRate = currency.exchangeRate({
                    source: 'USD',
                    target: 'CAD',
                    date: new Date()
                });

                return intSubtotal * (exRate / intRate)
            }

            return {beforeLoad, afterSubmit}

        });
