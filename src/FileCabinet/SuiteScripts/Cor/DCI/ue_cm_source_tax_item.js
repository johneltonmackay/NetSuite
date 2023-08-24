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
        const FIELD = {
            ENTITY: 'entity',
            TAX_ITEM: 'taxitem'
        }

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
            let strContext = scriptContext.type
            log.debug('TYPE', strContext)
            let objRecord = scriptContext.newRecord
            let strEntity = objRecord.getValue({
                fieldId: FIELD.ENTITY
            })

            if (strEntity) {
                try {
                    let strAccTaxItem = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: strEntity,
                        columns: [FIELD.TAX_ITEM]
                    })[FIELD.TAX_ITEM][0].value

                    if (strAccTaxItem) {
                        objRecord.setValue({
                            fieldId: FIELD.TAX_ITEM,
                            value: strAccTaxItem
                        })
                    }
                } catch (err) {
                    log.error('ERROR', err)
                }
            }
        }

        /*const afterSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord
            let strRecType = objRecord.type
            let strInternalId = objRecord.id
            let strEntity = objRecord.getValue({
                fieldId: FIELD.ENTITY
            })

            let strTaxItem = objRecord.getValue({
                fieldId: FIELD.TAX_ITEM
            })

            let strAccTaxItem = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: strEntity,
                columns: [FIELD.TAX_ITEM]
            })[FIELD.TAX_ITEM][0].value

            if (strAccTaxItem && strTaxItem!==strAccTaxItem) {
                try {
                    let STATUS = record.submitFields({
                        type: strRecType,
                        id: strInternalId,
                        values: {
                            [FIELD.TAX_ITEM]: strAccTaxItem
                        }
                    })
                    log.debug('SUCCESS',STATUS)
                } catch (err) {
                    log.error("ERROR", err)
                }
            }
        }*/

        return {
            beforeLoad
        }
    });