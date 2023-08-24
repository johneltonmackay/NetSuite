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
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let currRecord = scriptContext.newRecord
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

                currRecord.setText({
                    fieldId: 'custbody_total_cubic_feet',
                    value: totalCubicFeet,
                    ignoreFieldChange: true,
                });

                currRecord.setText({
                    fieldId: 'custbody_total_qty',
                    value: totalQty,
                    ignoreFieldChange: true,
                });



            }
        }
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
