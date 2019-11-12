function getPatientName (pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family.join(" ");
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

function getMedicationName (medCodings) {
  var coding = medCodings.find(function(c){
    return c.system == "http://www.nlm.nih.gov/research/umls/rxnorm";
  });

  return coding && coding.display || "Unnamed Medication(TM)"
}

function displayPatient (pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
}

var med_list = document.getElementById('med_list');

function displayMedication (medCodings) {
  med_list.innerHTML += "<li> " + getMedicationName(medCodings) + "</li>";
}

var smart = FHIR.client({
  serviceUrl: 'https://r2.smarthealthit.org',
  patientId: 'smart-1137192'
});

// pt = smart.patient;

// query : {"date-recorded": '2019-11-11'}
smart.patient.api.fetchAllWithReferences({type: 'Condition'}, ["Condition"]).then(function(results, refs) {
  console.log("Inside conditions search " + results.length) ;
  console.log(results) ;
  var cond_list = document.getElementById("cond_list") ;

  results.forEach(cond => {
    var coding = cond.code.coding.find(c => c.system == 'http://snomed.info/sct') ;
    cond_list.innerHTML += "<li>" + coding.display + "</li>" ;
  })
  

})

/*
smart.api.search({type: 'Patient'}).then((results, ref) => {
  console.log("inside patient results") ;
  //console.log(results)
  let row = 1 ;
  results.data.entry.forEach( (patient) => {
      let fullName = getPatientName(patient.resource) ;
      console.log("#" + row + " " + fullName) ;
      row++ ;
      let birthDate = patient.resource.birthDate ;
      let gender = patient.resource.gender ;
      let id = patient.resource.id ;
  }) ;
 
}) ;
*/

// Create a patient banner by fetching + rendering demographics
smart.patient.read().then(function(pt) {
  displayPatient (pt);
});

// A more advanced query: search for active Prescriptions, including med details
smart.patient.api.fetchAllWithReferences({type: "MedicationOrder"},["MedicationOrder.medicationReference"]).then(function(results, refs) {
  //console.log(results) ;
  let prescriptions = [{}] ;
   results.forEach(function(prescription){        
        let row = {} ;

        if (prescription.medicationCodeableConcept) {
            displayMedication(prescription.medicationCodeableConcept.coding);
            row.dosageInstruction = prescription.dosageInstruction.text ;
            row.prescription = getMedicationName(prescription.medicationCodeableConcept.coding);
            row.repeatsAllowed = prescription.dispenseRequest.numberOfRepeatsAllowed ;
            row.quantity = prescription.dispenseRequest.quantity.value ;
        } else if (prescription.medicationReference) {
            var med = refs(prescription, prescription.medicationReference);
            displayMedication(med && med.code.coding || []);
        }
   });
});

