/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/currentRecord'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{currentRecord} currentRecord
     */
    function (record, search, currentRecord) {

        function pageInit(scriptContext) {
            console.log('TEST2');
            var currRecord = scriptContext.currentRecord;
            var numLines = currRecord.getLineCount({sublistId: 'item'});
            log.debug('numLines', numLines)
            if (numLines > 0) {
                var totalCubicFeet = 0;
                var totalQty = 0;

                log.debug("Number of lines in sublist: ", numLines);

                for (let j = 0; j < numLines; j++) {
                    let itemCuFt = parseFloat(currRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_item_cuft',
                        line: j
                    })) || 0; // Use 0 if itemCuFt is not available

                    let itemQty = parseInt(currRecord.getSublistValue({
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

                currRecord.setValue({
                    fieldId: 'custbody_total_cubic_feet',
                    value: totalCubicFeet,
                    ignoreFieldChange: true,
                });

                currRecord.setValue({
                    fieldId: 'custbody_total_qty',
                    value: totalQty,
                    ignoreFieldChange: true,
                });

                let currency = currRecord.getValue({
                    fieldId: 'currency',
                });
                var foreignAmount
                if (currency != '2'){
                    let amtTotal = currRecord.getValue({
                        fieldId: 'total',
                    });
                    let exchangeRate = currRecord.getValue({
                        fieldId: 'exchangerate',
                    });
                    log.debug("amtTotal", amtTotal);
                    log.debug("exchangeRate", exchangeRate);
                    foreignAmount = amtTotal * exchangeRate
                    log.debug("foreignAmount", foreignAmount);
                } else {
                    foreignAmount = currRecord.getValue({
                        fieldId: 'total',
                    });
                }
                currRecord.setValue({
                    fieldId: 'custbody_total_amt_usd',
                    value: foreignAmount.toFixed(2),
                    ignoreFieldChange: true,
                });
            }
        }

        function postSourcing(scriptContext) {

        }



        return {
            pageInit: pageInit,
            postSourcing: postSourcing,
        };

    });
