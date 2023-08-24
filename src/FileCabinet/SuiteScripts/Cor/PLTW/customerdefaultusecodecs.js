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
    
    function pageInit(scriptContext) {
      var objCurrentRecord = scriptContext.currentRecord;
      var intCategory = objCurrentRecord.getValue({
        fieldId: 'category'
      });
      console.log("pageInit: category: ", intCategory);
      updateEntityUseCode(objCurrentRecord, intCategory !== '6' ? 13 : "", true);
      updateFinancial(objCurrentRecord);
    }

    function fieldChanged(scriptContext) {
      var objCurrentRecord = scriptContext.currentRecord;
      var strFieldChanging = scriptContext.fieldId;
      if (strFieldChanging === 'category') {
        var intCategory = objCurrentRecord.getValue({
          fieldId: 'category'
        });
        console.log("fieldChanged: category: ", intCategory);
        updateEntityUseCode(objCurrentRecord, intCategory !== '6' ? 13 : "", false);
      }
    }

    function validateField(scriptContext){
      var objCurrentRecord = scriptContext.currentRecord;
      var strFieldChanging = scriptContext.fieldId;
      if (strFieldChanging === 'custpage_ava_entityusecode'){
        updateFinancial(objCurrentRecord);
      }
      return true
    }

    //PRIVATE FUNCTION

    function updateEntityUseCode(objCurrentRecord, value, isPageInit) {

      var numLines = objCurrentRecord.getLineCount({
        sublistId: 'addressbook'
      });
      if (numLines) {
        console.log("numLines: ", numLines);
        for (var i = 0; i < numLines; i++) {
          console.log("i: ", i);
          objCurrentRecord.selectLine({
            sublistId: 'addressbook',
            line: i
          });

          let entityUseCode = objCurrentRecord.getCurrentSublistValue({
            sublistId: 'addressbook',
            fieldId: 'custpage_ava_entityusecode',
          });
          console.log("entityUseCode: ", entityUseCode);
          
          if (isPageInit && !entityUseCode || !isPageInit) {
            objCurrentRecord.setCurrentSublistValue({
              sublistId: 'addressbook',
              fieldId: 'custpage_ava_entityusecode',
              value: value,
              forceSyncSourcing: true,
            });
          }

          objCurrentRecord.commitLine({
            sublistId: 'addressbook'
          });
        }

        updateFinancial(objCurrentRecord)
      }
    }

    function updateFinancial(objCurrentRecord){

      objCurrentRecord.selectLine({
        sublistId: 'addressbook',
        line: 0
      });

      let entityUseCode = objCurrentRecord.getCurrentSublistValue({
        sublistId: 'addressbook',
        fieldId: 'custpage_ava_entityusecode',
        line: 0
      });

     
      objCurrentRecord.setValue({
        fieldId: 'custentity_useentitycodes',
        value: entityUseCode
      });


      console.log("updateFinancial", entityUseCode)

    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      validateField: validateField
    };

  });
