import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Contact } from '../..//model/contact';
import { ContactsService } from '../..//service/contacts.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../..//dialogs/confirm-dialog/confirm-dialog.component';
import { DialogResult } from '../..//config/dialog-result';
import { TotalNeuralium } from '../..//model/total-neuralium';
import { MatDialog } from '@angular/material';
import { TransactionsService } from '../..//service/transactions.service';
import { NotificationService } from '../..//service/notification.service';

@Component({
  selector: 'app-send-neuraliums',
  templateUrl: './send-neuraliums.component.html',
  styleUrls: ['./send-neuraliums.component.scss']
})
export class SendNeuraliumsComponent implements OnInit {
  @Input() neuraliumTotal : TotalNeuralium;
  @Input() currentAccountUuId:string;
  @Output() neuraliumsSent : EventEmitter<number> = new EventEmitter();

  sendDisabled: boolean = false;

  contacts: Array<Contact> = [];
  selectedContact: Contact;
  selectedContactManual: string;
  neuraliums: number = 0;
  fees: number = 0;
  note:string;

  canSendTransaction:boolean = false;

  constructor(
    private translateService: TranslateService,
    private contactsService: ContactsService,
    private transactionService: TransactionsService,
    private notificationService: NotificationService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.initialiseValues();

    this.transactionService.getCanSendTransactions().subscribe(canSend =>{
      this.canSendTransaction = canSend;
    })

    this.contactsService.getContacts().subscribe(contacts => {
      this.contacts = new Array<Contact>();
      var friendlyName = this.translateService.instant('send.InputContactIdManually');
      this.contacts.push({ friendlyName: friendlyName, id: null, isNew:true })
      contacts.forEach(contact => {
        this.contacts.push(contact);
      })
    })
  }

  initialiseValues(){
    this.selectedContact = null;
    this.selectedContactManual = null;
    this.neuraliums = 0;
    this.fees = 0;
    this.note = null;
    this.sendDisabled = false;
  }

  get contactSelected() {
    return this.selectedContact != void (0) && this.selectedContact.id !== "" && this.selectedContact.id !== null;
  }

  sendTransaction() {
    var destId: string = null;
    this.sendDisabled = true;

    if (this.selectedContact != void (0)) {
      destId = this.selectedContact.id;
    }
    else if (this.selectedContactManual != void (0)) {
      destId = this.selectedContactManual;
    }

    var isValid: boolean = true;

    if (destId == null) {
      isValid = false;
      var message = this.translateService.instant('send.PleaseChooseContactInTheListOrInputContactId');
      this.notificationService.showError(message);
    }

    
    if (this.neuraliums <= 0) {
      isValid = false;
      var message = this.translateService.instant('send.PleaseInputNeuraliumAmount');
      this.notificationService.showError(message);
    }
    

    var finalFees: number = 0;
    if (this.fees == void (0)) {
      finalFees = 0;
    }
    else {
      finalFees = this.fees;
    }

    if (finalFees < 0) {
      isValid = false;
      var message = this.translateService.instant('send.WrongFees');
      this.notificationService.showError(message);
    }

    var total = finalFees + this.neuraliums;
    
    if (total > this.neuraliumTotal.usable) {
      isValid = false;
      var message = this.translateService.instant('send.NotEnoughNeuraliums');
      this.notificationService.showError(message);
    }

    if (isValid) {
      var message = this.translateService.instant("send.PleaseConfirmSending");
      if (this.selectedContact != void (0)) {
        var name = this.selectedContact.friendlyName;
        this.translateService.get("send.SendingValueConfirmationWithName", { neuraliums : this.neuraliums,name:name, id: destId }).subscribe(messagePart =>{
          message += " " + messagePart;
          this.send(destId,this.neuraliums, finalFees,message);
        })
      }
      else{
        this.translateService.get("send.SendingValueConfirmation", { neuraliums : this.neuraliums, id: destId }).subscribe(messagePart =>{
          message += " " + messagePart;
          this.send(destId,this.neuraliums, finalFees,message);
        })
      }
    }
    else{
      this.sendDisabled = false;
    }
  }

  private send(targetAccountId: string, neuraliums: number, fees: number, confirmMessage: string) {
    var total = neuraliums + fees;
    setTimeout(() => {
      let dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '650px',
        data: confirmMessage
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult == DialogResult.Yes) {
          this.transactionService.saveTransaction(targetAccountId, neuraliums, fees, this.note)
            .then(() => {
              this.neuraliumsSent.emit(total);
              setTimeout(() => {
                this.initialiseValues();
              }, 2000);
            })
            .catch(reason => {
              this.notificationService.showError(reason);
            });
        }
        else{
          this.sendDisabled = false;
        }
      })
    });
  }
}
