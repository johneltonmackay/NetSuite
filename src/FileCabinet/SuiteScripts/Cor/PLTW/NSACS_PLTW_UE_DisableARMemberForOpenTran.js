/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/serverWidget', 'N/runtime'],

function(search, serverWidget, runtime) {

    const searchIdUsed = 'customsearch_nsacs_script_cust_open_bal';
    const arRepFieldId = 'custentity_acs_ar_rep';
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function disableARMemberBeforeLoad(scriptContext) {
        var logTitle = 'disableARMemberBeforeLoad';
        try {
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                var userRole = runtime.getCurrentUser().role;
                log.debug(logTitle + ' - userRole', userRole);
                var newRecord = scriptContext.newRecord;
                var form = scriptContext.form;
                var arRepFieldObj = form.getField({
                    id: arRepFieldId
                });
                var activeAccountId = newRecord.id;
                log.debug(logTitle + ' - activeAccountId', activeAccountId);

                var currentlySetARRep = newRecord.getValue({
                    fieldId: arRepFieldId
                });
                log.debug(logTitle + ' - currentlySetARRep', currentlySetARRep);

                var currentUserId = runtime.getCurrentUser().id;
                log.debug(logTitle + ' - currentUserId', currentUserId);

                var currentUserRole = runtime.getCurrentUser().role;
                log.debug(logTitle + ' - currentUserRole', currentUserRole);

                if (!isNullOrEmpty(currentlySetARRep) && !isNullOrEmpty(activeAccountId)) {
                    // 10282019 Commenting out next lines to make way for new requirement
                    /*var countOfOpenTransactions = 0;
                    var searchObj = search.load({id : searchIdUsed});
                    var filters = searchObj.filters;
                    var filterActiveAccount = search.createFilter({ //create new filter
                        name: 'internalidnumber',
                        operator: search.Operator.EQUALTO,
                        values: activeAccountId
                    }); 
                    filters.push(filterActiveAccount);

                    var filteredForFollowUp = filters.filter(function(val) {
                        return val.name != 'custevent_acs_for_ffup';
                    });

                    searchObj.filters = filteredForFollowUp;

                    searchObj.run().each(function(result) {
                        countOfOpenTransactions++;
                        return true;
                    });

                    log.debug(logTitle + ' - countOfOpenTransactions', countOfOpenTransactions);

                    if (countOfOpenTransactions > 0) {
                        arRepFieldObj.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                    }*/

                    /*
                    *    10282019 New requirement: 
                    *    •	To be able to edit the Assigned A/R Representative field in the customer record even if there are still Open transactions.
                    *    •	Make sure that the updated A/R rep reflects accordingly in the subsequent task records that will be created.
                    *    •	Only a specific person will have the ability to change the assigned A/R representative in the customer record.
                    */
                    var changeARMemberPermission = false;
                    
                    if (currentUserId != -4) {
                        // Look for permission
                        changeARMemberPermission = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: currentUserId,
                            columns: 'custentity_acs_change_ar_rep'
                        }).custentity_acs_change_ar_rep;
                    }
                    log.debug(logTitle + ' - changeARMemberPermission', changeARMemberPermission);

                    if (!changeARMemberPermission) {
                        arRepFieldObj.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                    }
                    const roleToDisplayType = {
                        '1046': serverWidget.FieldDisplayType.NORMAL,      // PLTW Senior Accountant II
                        '1008': serverWidget.FieldDisplayType.NORMAL,      // PLTW Controller
                        '1023': serverWidget.FieldDisplayType.NORMAL,      // PLTW Director of Finance
                        '3': serverWidget.FieldDisplayType.NORMAL          // Administrator
                    };

                    // Get the display type based on the user role or set to DISABLED if not found
                    const displayType = roleToDisplayType[userRole] || serverWidget.FieldDisplayType.DISABLED;

                    // Update the field display type
                    arRepFieldObj.updateDisplayType({
                        displayType: displayType
                    });

                }
                
            }
        } catch (error) {
            log.error(logTitle + ' - An error has occurred', error);
        }
    }

    function isNullOrEmpty(value) {
        return value === undefined || value === null || value === '';
    }

    return {
        beforeLoad: disableARMemberBeforeLoad
    };
    
});
