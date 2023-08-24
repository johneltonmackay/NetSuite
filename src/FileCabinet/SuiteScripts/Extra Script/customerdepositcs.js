/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
/**
 * @param{record} record
 */
function(record) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        console.log(scriptContext.mode)
        var objCurrentRecord = scriptContext.currentRecord;
        var inRefNum = objCurrentRecord.getValue({
            fieldId: 'inputpnrefnum'
        })
        console.log('inRefNum', inRefNum);
        if (inRefNum){
            objCurrentRecord.setValue({
                fieldId: 'pnrefnum',
                value: inRefNum.toString()
            });
            console.log('inRefNum', 'true');

        }
        // else {
        //     objCurrentRecord.setValue({
        //         fieldId: 'pnrefnum',
        //         value: "6893483567436238903009"
        //     });
        //     console.log('inRefNum', 'false');
        //
        // }

    }

    return {
        pageInit: pageInit,
    };
    
});
