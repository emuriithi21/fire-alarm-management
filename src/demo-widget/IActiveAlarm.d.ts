import { IAlarm
 } from "@c8y/client";
export interface IActiveAlarm {
   
   Name: string;
   
   Resident: string,  
 
   Community: string;
 
   Villa_no: string;
 
   Timestamp: number;
 
   Phone_Number: string;
 
   Makani: string;
 
   Remaining_time:  number;
 
   Remaining_time_string: string;
 
   Dropdown_active: boolean;
 
   Source : string,
 
   Position:
   {
     lat:number,
     lng:number
   },
   
   c8y_Alarm:IAlarm
 }
 