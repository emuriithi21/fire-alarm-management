import { Component, Input, OnInit } from '@angular/core';
import {EventService, OperationService} from '@c8y/ngx-components/api';
import { InventoryService } from '@c8y/ngx-components/api';
import { AlarmService } from '@c8y/ngx-components/api'
import { AlertService, sortByPriority } from '@c8y/ngx-components';
import {Realtime} from '@c8y/ngx-components/api';
import { IAlarm, IOperation } from '@c8y/client';
import { Severity } from '@c8y/client';
import { AlarmStatus } from '@c8y/client';

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
    public remaining_time: number = 180;
    public remaining_time_string: string = "_:__";
    public active_alarm_id: string = null;
    public refreshintervalId: number = null;
    public active_alarm : IAlarm = null;
    public alarm_active : boolean = false;
    public countdown_active: boolean = false;
    public dropdown_collapsed: boolean = true;
    ngOnInit(): void {

        

        let last_day = new Date('23 January 2021 08:48 UTC').toISOString();
        let today = new Date().toISOString();
        const filter: object = {
            severity: Severity.MAJOR,
            pageSize: 100,
            dateFrom: last_day,
            dateTo: today,
            source: "14489852",          
            withTotalPages: true

            

          };

          (async () => {
            const {data, res, paging} = await this.alarmservice.list(filter);
            let alarm_data: IAlarm[] = data;
            let i: number = 0;
            for (i = 0; i < alarm_data.length ; i++)
            {
                let alarm: IAlarm = alarm_data[i]

                if (alarm.status == AlarmStatus.ACTIVE)

                {    
                let alarmTime: number = Math.floor(new Date(alarm.time).getTime()/1000);
                let slaTime: number = alarmTime + 180;
                let now: number = Math.floor(Date.now()/1000);
                
    
                    if (now > slaTime)
    
                    {
                        this.clear_alarm(alarm)
                    }
                    else
                    {
                        this.active_alarm_id = alarm.id;
                        this.active_alarm = alarm;

                    }
    
                    //this.tracked_active_alarms.push(alarm);
                    //this.active_ids.push(alarm.id)
                }
                else if (alarm.status == AlarmStatus.ACKNOWLEDGED)
                {
                    this.tracked_acknowledged_alarms.push(alarm); 
                    this.acknowledged_ids.push(alarm.id)             }

                else
                {

                    this.tracked_cleared_alarms.push(alarm);
                    this.cleared_ids.push(alarm.id)
                }

            }
           
            
           if (this.active_alarm_id != null)

           {
            this.remaining_time_string = "_:__";
            this.alarm_active = true;
            let alarmTime: number = Math.floor(new Date(this.active_alarm.time).getTime()/1000);
            let slaTime: number = alarmTime + 180;
            let now: number = Math.floor(Date.now()/1000);
                
            this.remaining_time = slaTime-now-2
          
            this.countdown_active = true;            
            this.refreshintervalId = window.setInterval(()=>{ 
                    
                if (this.remaining_time > 1)
                {

                this.remaining_time --;
                    

                }
                
                if (this.remaining_time == 1)

                {
                    this.remaining_time = 0; 
                    this.transfer()
                    this.countdown_active = false;
                    clearInterval(this.refreshintervalId);
                }
                this.remaining_time_string = Math.floor(this.remaining_time / 60).toString() + ':' + (this.remaining_time % 60).toLocaleString('en-US', {
                    minimumIntegerDigits: 2,
                    useGrouping: false
                  });
                }, 1000);
            

           }

          })();


          if (this.tracked_active_alarms.length > 1)

           {

            let i = 0

            for (i = 0; i< this.tracked_active_alarms.length ; i++)

            {
                let alarm = this.tracked_cleared_alarms[i]

               

            }

           }

        const alarm_subscription = this.realtime.subscribe('/alarms/14489852', (data ) => {
            console.log(data.data.data); // logs all alarm CRUD changes
            let alarm: IAlarm = data.data.data

           
            console.log(alarm.status)

            console.log(alarm.id)

            console.log(alarm.creationTime)

            

            
            if (alarm.status == AlarmStatus.ACTIVE)

            {   if (alarm.id != this.active_alarm_id)
                {
                this.remaining_time_string = "_:__";
                this.alarm_active = true;
                this.active_alarm = alarm
                let alarmTime: number = Math.floor(new Date(alarm.time).getTime()/1000);
                let slaTime: number = alarmTime + 180;
                let now: number = Math.floor(Date.now()/1000);
                console.log(now)
                console.log(alarmTime)
                this.remaining_time = slaTime-now-2
                
                this.countdown_active = true;
                this.refreshintervalId = window.setInterval(()=>{ 
                    
                    if (this.remaining_time > 1)
                    {

                    this.remaining_time --;
                        

                    }
                    
                    else if (this.remaining_time == 1)

                    {
                        this.remaining_time = 0; 
                        this.transfer()
                        this.countdown_active = false;
                        clearInterval(this.refreshintervalId);

                    }
                    this.remaining_time_string = Math.floor(this.remaining_time / 60).toString() + ':' + (this.remaining_time % 60).toLocaleString('en-US', {
                        minimumIntegerDigits: 2,
                        useGrouping: false
                      });
                    }, 1000);

                    
                
            

                }
            }

            if (alarm.status == AlarmStatus.CLEARED  && (this.alarm_active))

            {
                this.alarm_active = false;

            }


          });

          
        
    }
  


    transfer(): void

    {   if (this.countdown_active)
        {
            this.countdown_active = false;

            clearInterval(this.refreshintervalId);
        }
        
        this.alert.add({
            text: 'Alarm Transferred Successfully',
            type: 'success',
            timeout: 5000,
            detailedData: 'Alarm Trasferred Successfully to DCD Dispatch System'
          } as Alert);
          
          setTimeout(()=>{ 
            
            this.dropdown_collapsed = true;
            this.alarm_active = false;
            
            }, 1000);
            
        this.clear_alarm(this.active_alarm);

        let dispatch_alarm: IAlarm ={

            severity: Severity.MAJOR,
            source: {

                "id": "14636205"
            },

            time:  new Date().toISOString(),

            type: "dispatch_alarm",

            text: "Fire Alarm on Zahra Villas No. 10"


        }
        this.alarmservice.create(dispatch_alarm)

        let transfer_event: IEvent = {

            source:{
                id: "14489852"
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
    
 

    false_alarm(): void
    {   
        
        if (this.countdown_active)
        {
            this.countdown_active = false;

            clearInterval(this.refreshintervalId);
        }

        this.alert.add({
            text: 'False Alarm Cleared',
            type: 'success',
            timeout: 5000,
            detailedData: 'False Alarm Cleared Successfully'
          } as Alert);
          
          setTimeout(()=>{ 
            
            this.dropdown_collapsed = true;
            this.alarm_active = false;
            
            }, 2007);
           

            this.clear_alarm(this.active_alarm)

            let false_alarm_event: IEvent = {

                source:{
                    id: "14489852"
                },
                type: "FireAlarmEvent",
    
                text: "Fire Alarm Cleared as a False Alarm",
    
                time: new Date().toISOString(),
            };
    
                this.eventService.create(false_alarm_event);
    

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
    
}
