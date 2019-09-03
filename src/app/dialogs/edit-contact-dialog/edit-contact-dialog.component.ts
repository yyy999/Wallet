import { Component, OnInit, Inject, Optional } from '@angular/core';
import { Contact } from '../../model/contact';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { DialogResult } from '../../config/dialog-result';

@Component({
  selector: 'app-edit-contact-dialog',
  templateUrl: './edit-contact-dialog.component.html',
  styleUrls: ['./edit-contact-dialog.component.scss']
})
export class EditContactDialogComponent implements OnInit {
 contact:Contact;
  constructor(
    public dialogRef: MatDialogRef<EditContactDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Contact
  ) { 
    this.contact = Object.assign({},this.data);
  }

  ngOnInit() {
  }

  save(){
    this.dialogRef.close(this.contact);
  }

  cancel(){
    this.dialogRef.close(DialogResult.Cancel);
  }
}
