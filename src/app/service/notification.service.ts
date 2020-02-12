import { Injectable } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

    showSuccess(msg:string, title:string = "Success") {
        setTimeout(() => {
            this.snackBar.open(msg,title,{
                horizontalPosition : 'center',
                verticalPosition : 'top',
                duration:5000,
                panelClass:["snackBar-alert-success"]
            });
        }, 100);
        
    }

    showInfo(msg:string, title:string = "Notification") {
        setTimeout(() => {
            this.snackBar.open(msg,title,{
                horizontalPosition : 'center',
                verticalPosition : 'top',
                duration:5000,
                panelClass:["snackBar-alert-info"]
            });
        }, 100);
        
    }

    showWarn(msg:string, title:string = "Warning") {
        setTimeout(() => {
            this.snackBar.open(msg,title,{
                horizontalPosition : 'center',
                verticalPosition : 'top',
                duration:5000,
                panelClass:["snackBar-alert-warn"]
            });
        }, 100);
        
    }

    showError(msg:string, title:string = "An error occured") {
        setTimeout(() => {
            this.snackBar.open(msg,title,{
                horizontalPosition : 'center',
                verticalPosition : 'top',
                duration:5000,
                panelClass:["snackBar-alert-danger"]
            });
        }, 100);
        
    }
}
