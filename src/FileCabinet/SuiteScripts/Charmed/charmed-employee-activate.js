/*

Disable Employee

*/


/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/search', 'N/record', 'N/email', 'N/runtime'],
    function(search, record, email, runtime) {
        function execute(context) {

            var searchId2 = runtime.getCurrentScript().getParameter("custscript_empsrc_activate");
			log.debug({
					details: 'searchId2 (active) ' + searchId2
				});

            try {

				//activate
               search.load({
				   id: searchId2
                }).run().each(function(result) {
					log.debug({
                        details: 'activating employee id: ' + result.id
                    });


					var id = record.submitFields({
						type: record.Type.EMPLOYEE,
						id: result.id,
						values: {
							isinactive: false
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
					});


                    return true;
                });
            } catch (e) {
                var subject = 'Fatal Error: Unable to inactivate Employee Id! ';
                var authorId = -5;
                var recipientEmail = 'john.mackay@charmedaroma.com';
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                });
            }
        }
        return {
            execute: execute
        };
    });