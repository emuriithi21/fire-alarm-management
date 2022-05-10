import { Component, Input, OnInit } from '@angular/core';
import {EventService, OperationService} from '@c8y/ngx-components/api';
import { InventoryService } from '@c8y/ngx-components/api';
import { AlarmService } from '@c8y/ngx-components/api'
import { AlertService, sortByPriority, Status } from '@c8y/ngx-components';
import {Realtime} from '@c8y/ngx-components/api';
import { IAlarm, IdReference, IOperation, IResultList,IManagedObject } from '@c8y/client';
import { Severity } from '@c8y/client';
import { AlarmStatus } from '@c8y/client';
import { IActiveAlarm } from './IActiveAlarm';
//import {IActiveAlarm} from "./demo-widget-config.component";
import { NgModule } from '@angular/core';
import { expandFormat } from 'ngx-bootstrap/chronos/format';
import { Alert } from '@c8y/ngx-components';
import { ISource,  IEvent } from '@c8y/client';


@Component({
    templateUrl: './demo-widget.component.html',
    styles: [ `.text { transform: scaleX(-1); font-size: 3em ;}` ,
    "../node_modules/bootstrap/dist/css/bootstrap.min.css",]
})
export class WidgetDemo implements OnInit {

    constructor(
      
        private eventService: EventService,
        private operationService: OperationService,
        private alert: AlertService,
        private inventoryService: InventoryService,
        private alarmservice: AlarmService,
        private realtime: Realtime

        ) {}

    public isCollapsed = true;

    public tracked_active_alarms: IAlarm[] = []
    public active_ids: string[] = []
    public tracked_acknowledged_alarms: IAlarm[] = []
    public acknowledged_ids: string[] = []
    public tracked_cleared_alarms: IAlarm[] = []
    public cleared_ids: string[] = []
    public remaining_time: number = 120;
    public remaining_time_string: string = "_:__";
    public active_alarm_id: string = null;
    public refreshintervalId: number = null;
    public active_alarm : IAlarm = null;   
    public countdown_active: boolean = false;
    public dropdown_collapsed: boolean = true;
    public villas: IManagedObject[] = []
    public num_villas: number = 6;    
    public active_alarms :IActiveAlarm[] =[];
        
     
    ngOnInit(): void {
        
        const filter: object = {
            pageSize: 100,
            withTotalPages: true
          };
            
          const query = {
            type: 'moro-villa*'
        }
         
        this.update_num_active_alarms()
        this.inventoryService.listQueryDevices(query, filter).then(data =>
        
        {

            let devices :IResultList<IManagedObject> = data;

            this.villas =  devices.data

            console.log("Got the Villas ")

           
        });


        let today = new Date();

        let date_From = today.getTime() - 120000

        let last_day = new Date('23 January 2022 08:48 UTC').toISOString();
        const alarm_filter: object = {
            severity: Severity.MAJOR,
            pageSize: 100,            
            type: "residential_alarm",         
            status: AlarmStatus.ACTIVE

          };

          
            console.log("Querying for alarms")
            this.alarmservice.list(alarm_filter).then(data =>
        
            {
            let query_result:IResultList<IAlarm> = data
            let alarm_data = query_result.data
            console.log("Got alarms of length: " + String(alarm_data.length))
            let i: number = 0;
            for (i = 0; i < alarm_data.length ; i++)
            {
                let alarm: IAlarm = alarm_data[i]

                if (alarm.status == AlarmStatus.ACTIVE  && alarm.type =="residential_alarm")

                {    
                let alarmTime: number = Math.floor(new Date(alarm.time).getTime()/1000);
                let slaTime: number = alarmTime + 120;
                let now: number = Math.floor(Date.now()/1000);
                console.log("Got Alarm for Device " + String(alarm.source.id)) 
    
                if (now > slaTime)

                {
                    this.clear_alarm(alarm)
                }

                else
                    {
                        console.log("Got Alarm for Device " + String(alarm.source.id))  
                    
                        let alarmTime: number = Math.floor(new Date(alarm.time).getTime()/1000);
                        let slaTime: number = alarmTime + 120;
                        let now: number = Math.floor(Date.now()/1000);
                        let remaining_time = slaTime-now-2
                        let remaining_time_string = Math.floor(remaining_time / 60).toString() + ':' + (remaining_time % 60).toLocaleString('en-US', {
                            minimumIntegerDigits: 2,
                            useGrouping: false
                        });
                        
                        this.villas.forEach(villa => {

                        if (villa.id == alarm.source.id)
                        
                        {
                            
                            let act_alarm :IActiveAlarm={

                                Name: villa.name,
                                Resident: villa.Resident,  
                                Community: villa.Community,          
                                Villa_no: villa.villaNo,
                                Timestamp: alarmTime,              
                                Phone_Number: villa.phoneNumber,
                                Makani: villa.Makani,
                                Remaining_time: remaining_time,
                                Remaining_time_string : remaining_time_string,
                                Dropdown_active: false,
                                Source : villa.id,                            
                                Position:
                                {
                                    lat:  villa.c8y_Position.lat,
                                    lng: villa.c8y_Position.lng
                                },
                                c8y_Alarm: alarm

                                }
                                let alarm_present_for_device = false
                                this.active_alarms.forEach(active_alarm => {
                                
                                    if (active_alarm.Source == alarm.source.id)
                                    
                                    {
                                        alarm_present_for_device = true
                                        this.clear_alarm(alarm)
                                    }
                                });

                                if(!alarm_present_for_device)
                                {
                                this.active_alarms.push(act_alarm)
                                this.update_num_active_alarms()
                                }

                            
                        }
                        
                    });
                    

                    

                }

                    }
    
             

            }        
            

        });


        this.refreshintervalId = window.setInterval(()=>{ 


            if (this.active_alarms.length > 0)

            {
                console.log("Number of Active Alarms is: " + String(this.active_alarms.length))

                let i = 0;
                this.active_alarms.forEach((alarm, index) => {
                
                   
                    if (alarm.Remaining_time > 1)
                    {

                        alarm.Remaining_time --;
                        

                    }

                    else if (alarm.Remaining_time == 1)

                    {
                        alarm.Remaining_time = 0; 
                        this.active_alarms.splice(index,1)
                        this.update_num_active_alarms()
                        this.transfer(alarm)
                        //this.countdown_active = false;                        

                    }

                    alarm.Remaining_time_string = Math.floor(alarm.Remaining_time / 60).toString() + ':' + (alarm.Remaining_time % 60).toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                        useGrouping: false
                      });


                });
                    
                
                
            }
                
        }, 1000);
            
        
        let channel = '/alarms/*'  
        const alarm_subscription = this.realtime.subscribe(channel, (data ) => {
        console.log(data.data.data); // logs all alarm CRUD changes
        let alarm: IAlarm = data.data.data

            
            if (alarm.status == AlarmStatus.ACTIVE)
            {
                if (alarm.type == "residential_alarm")
                {
                    console.log("Got Alarm for Device " + String(alarm.source.id))  
                    
                    let alarmTime: number = Math.floor(new Date(alarm.time).getTime()/1000);
                    let slaTime: number = alarmTime + 120;
                    let now: number = Math.floor(Date.now()/1000);
                    let remaining_time = slaTime-now-2
                    let remaining_time_string = Math.floor(remaining_time / 60).toString() + ':' + (remaining_time % 60).toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                        useGrouping: false
                      });
                    let alarm_source = alarm.source.id

                    this.villas.forEach(villa => {

                        if (villa.id == alarm.source.id)
                        
                        {
                        
                        let act_alarm :IActiveAlarm={

                            Name: villa.name,  
                            Resident: villa.Resident,
                            Community: villa.Community,          
                            Villa_no: villa.villaNo,
                            Timestamp: alarmTime,              
                            Phone_Number: villa.phoneNumber,
                            Makani: villa.Makani,
                            Remaining_time: remaining_time,
                            Remaining_time_string : remaining_time_string,
                            Dropdown_active: false,
                            Source : villa.id,                            
                            Position:
                            {
                                lat:  villa.c8y_Position.lat,
                                lng: villa.c8y_Position.lng
                            },
                            c8y_Alarm: alarm

                            }
                            let alarm_present_for_device = false
                            this.active_alarms.forEach(active_alarm => {
                               
                                if (active_alarm.Source == alarm.source.id)
                                
                                {
                                    alarm_present_for_device = true
                                    this.clear_alarm(alarm)
                                }
                            });

                            if(!alarm_present_for_device)
                            {
                            this.active_alarms.push(act_alarm)
                            this.update_num_active_alarms()
                            }

                            
                        }
                        
                    });
                    

                    

                }
            }
                                      
            });

          
        }  
    


    transfer(alarm: IActiveAlarm): void

    {  
        
        this.alert.add({
            text: 'Alarm Transferred Successfully',
            type: 'success',
            timeout: 5000,
            detailedData: 'Alarm Trasferred Successfully to DCD Dispatch System'
          } as Alert);
          
          
        this.remove_alarm(alarm)
        this.clear_alarm(alarm.c8y_Alarm)
        //this.clear_alarm(this.active_alarm);

        let dispatch_alarm: IAlarm ={

            severity: Severity.MAJOR,
            source: {

                "id": alarm.Source
            },

            time:  new Date().toISOString(),

            type: "dispatch_alarm",

            text: "Fire Alarm Dispatched for " + String(alarm.Community) + " " + String(alarm.Villa_no)


        }
        this.alarmservice.create(dispatch_alarm)

        let transfer_event: IEvent = {

            source:{
                id: alarm.Source
            },
            type: "FireAlarmEvent",

            text: "Fire Alarm Transferred to DCD Dispatch Center",

            time: new Date().toISOString(),
        };

            this.eventService.create(transfer_event);

      
        
    }

    call(): void

    {   
        
        
        this.alert.add({
            text: 'Calling Home Owner',
            type: 'info',
            timeout: 5000,
            detailedData: 'Routing Call to Owner through Avaya'
          } as Alert);
        
        }
    
 

    false_alarm(alarm:IActiveAlarm): void
    {   
        
      

        this.alert.add({
            text: 'False Alarm Cleared',
            type: 'success',
            timeout: 5000,
            detailedData: 'False Alarm Cleared Successfully'
          } as Alert);
          
          setTimeout(()=>{ 
            
            this.remove_alarm(alarm)
            
            
            }, 300);
           

            this.clear_alarm(alarm.c8y_Alarm)

            let false_alarm_event: IEvent = {

                source:{
                    id: alarm.Source
                },
                type: "FireAlarmEvent",
    
                text: "Fire Alarm Cleared as a False Alarm",
    
                time: new Date().toISOString(),
            };
    
                this.eventService.create(false_alarm_event);

                 

    }

    remove_alarm(to_remove: IActiveAlarm): void

    {   
        this.active_alarms.forEach((alarm, index) => {

        if (to_remove.c8y_Alarm.id == alarm.c8y_Alarm.id)

        {

            this.active_alarms.splice(index,1)
            this.update_num_active_alarms()
        }

    });

    }



    clear_alarm(alarm: IAlarm): void


    {  
       
        const partialUpdateObject: Partial<IAlarm> = {
            
            id: alarm.id,
            status:AlarmStatus.CLEARED
            
        };


        this.alarmservice.update(partialUpdateObject)
       

    }


    acknowledge_alarm(alarm: IAlarm): void


    {  
       
     
        const partialUpdateObject: Partial<IAlarm> = {
            
            id: alarm.id,
            status:AlarmStatus.ACKNOWLEDGED,
            text: "Residential Alarm at Zahra Villas No 10 - Directed to DCD",
            alt_text: "Residential Alarm at Zahra Villas No. 10 - Directed to DCD"
            
            
        };

        this.alarmservice.update(partialUpdateObject)
       

    }
    show_on_map(alarm: IActiveAlarm)
    {    
        let source:ISource ={
            id: '16997973'
        }
        const create_marker_event: IEvent = {
            source: source,
            text: 'Show Marker',
            time: new Date().toISOString(),
            type: 'add_marker',
            device: alarm.Source,
            position:{
                lat: alarm.Position.lat,
                lng:alarm.Position.lng
            }

          };
         
        this.eventService.create(create_marker_event)
        console.log("Adding marker for Device ID " + alarm.Source)
    }

    remove_from_map(alarm: IActiveAlarm)
    {   
        
        let source:ISource ={
            id: '16997973'
        }
        const remove_marker_event: IEvent = {
            source: source,
            text: 'Remove Marker',
            time: new Date().toISOString(),
            type: 'remove_marker',
            device: alarm.Source,
            position:{
                lat: alarm.Position.lat,
                lng:alarm.Position.lng
            }

          };
         
        this.eventService.create(remove_marker_event)
        console.log("Removing marker for Device ID " + alarm.Source)
    }

    update_num_active_alarms()

    {   let source:ISource ={
        id: '16997973'
    }
        let num_alarms_device:Partial<IManagedObject> =
        {
            id: source.id,
            active_fire_alarms: this.active_alarms.length

        }
        this.inventoryService.update(num_alarms_device)


    }
    
}
