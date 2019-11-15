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
import { AccountsService } from '../..//service/accounts.service';


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
  tip: number = 0;
  note:string;

  canSendTransaction:boolean = false;

  constructor(
    private translateService: TranslateService,
    private contactsService: ContactsService,
    private transactionService: TransactionsService,
    private notificationService: NotificationService,
    private accountService: AccountsService,
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
    this.tip = 0;
    this.note = null;
    this.sendDisabled = false;
  }

  get contactSelected() {
    return this.selectedContact && this.selectedContact.id !== "" && this.selectedContact.id !== null;
  }

  sendTransaction() {
    var accountId: string = null;
    this.sendDisabled = true;

    if (this.selectedContact) {
      accountId = this.selectedContact.id;
    }
  
    if (!accountId && this.selectedContactManual) {
      accountId = this.selectedContactManual;
    }

    var isValid: boolean = true;

    if (!accountId) {
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
    if (!this.tip) {
      finalFees = 0;
    }
    else {
      finalFees = this.tip;
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

      
      accountId = this.accountService.FormatAccountId(accountId);


      if (this.selectedContact && this.selectedContact.id) {
        var name = this.selectedContact.friendlyName;
        this.translateService.get("send.SendingValueConfirmationWithName", { neuraliums : this.neuraliums,name:name, id: accountId }).subscribe(messagePart =>{
          message += " " + messagePart;
          this.send(accountId,this.neuraliums, finalFees,message);
        })
      }
      else{
        this.translateService.get("send.SendingValueConfirmation", { neuraliums : this.neuraliums, id: accountId }).subscribe(messagePart =>{
          message += " " + messagePart;
          this.send(accountId,this.neuraliums, finalFees,message);
        })
      }
    }
    else{
      this.sendDisabled = false;
    }
  }

  private send(targetAccountId: string, neuraliums: number, tip: number, confirmMessage: string) {
    var total = neuraliums + tip;
    setTimeout(() => {
      let dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '650px',
        data: confirmMessage
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult === DialogResult.Yes) {
          this.transactionService.saveTransaction(targetAccountId, neuraliums, tip, this.note)
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
