import { Component, Input } from '@angular/core';
import { IAlarm } from '@c8y/client';

@Component({
    template: `<div class="form-group">
    <c8y-form-group>
      <label translate>Text</label>
      <textarea style="width:100%" [(ngModel)]="config.text"></textarea>
    </c8y-form-group>
  </div>`
})
export class WidgetConfigDemo {
    @Input() config: any = {};
}

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
