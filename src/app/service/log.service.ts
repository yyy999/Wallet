import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  constructor() { }

  logDebug(message:string, data:any){
    console.info(message);
    console.info(JSON.stringify(data));
  }
}
