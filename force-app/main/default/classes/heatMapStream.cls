public with sharing class heatMapStream {

        @AuraEnabled(cacheable=true)
        public static Map<String, State__c> getCovidStateMap(){
            Map<String, State__c> covidMap = new Map<String, State__c>();
            for (State__c state : [SELECT Full_Name__c, Deaths__c FROM State__c]){
                covidMap.put(state.Full_Name__c, state);
            }
            return covidMap; 
        

    }
}
