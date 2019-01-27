import { Component, OnInit, ViewChild, OnDestroy,AfterViewInit, ElementRef } from '@angular/core';
import { MatSnackBar, MatInput } from '@angular/material';
import { SearchService } from '../../services/search.service';
import { ShowDetailsComponent } from '../show-details/show-details.component';
import { UiServiceService } from 'src/app/services/ui-service.service';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap, switchMap } from 'rxjs/operators';
import { NgModel } from '@angular/forms';



@Component({
  selector: 'app-shows-list',
  templateUrl: './shows-list.component.html',
  styleUrls: ['./shows-list.component.scss']
})
export class ShowsListComponent implements OnInit, OnDestroy,AfterViewInit {

  public Shows: Array<any>;
  public Pages: any;
  pagination: boolean = true;
  errorState: boolean;
  retryIndex = 1;
  home = false;
  showsLoading: boolean;
  searchTerm;

  subscribe: Subscription;
  typeAhead: Subscription;

  @ViewChild('input') searchInput:ElementRef;

  /** PAGINATION */
  length = 2504;
  pageSize = 50;
  pageIndex;
  pageSizeOptions = [50, 30, 10];

  constructor(
    private  UI: UiServiceService,
    private request: SearchService
  ) {

  }


  ngOnInit() {
    this.requestShowList(1);
  }

   ngAfterViewInit(){

     fromEvent(this.searchInput.nativeElement, 'keyup').pipe(
        debounceTime(2000),
        map((event:Event) => (<HTMLInputElement>event.target).value),
        distinctUntilChanged()
      ).subscribe((val:string) => {
          if (val.trim().length === 0 || !val ) {
            // do nothing
          } else {
            this.search(val)
          }
      })

  }

  requestShowList(i) {
    this.showsLoading = true;
    this.pagination = false;
    this.subscribe = this.request.getShowsList(i).subscribe(data => {
      this.Shows = data;
      this.showsLoading = false;
      this.pagination = true;
    this.errorState = false;
  }, err =>{
    this.openSnackbar(err);
    this.errorState = true;
    this.showsLoading = false;
  });

  }

  openDialog(data): void {
     const info: object = {
      id: data
    }
    this.UI.openDialog(info,ShowDetailsComponent, 'Download-dialog');
  }

  search(keyword:string) {
    this.showsLoading = true;
    this.errorState = false;
    this.home = true;
    this.pagination = false;

    this.subscribe =  this.request.getShowsByKeyword(keyword).subscribe(
      data => {
         this.Shows = data
         this.showsLoading = false;

         if (this.Shows.length == 0) {
           this.openSnackbar(`${keyword} Not Found`);
         }else {
           this.openSnackbar(`${this.Shows.length} Results Found`)
         }
        }, err => {
          this.openSnackbar(err);
          this.showsLoading = false;
          this.errorState = false;
        }
    )
  }

  Retry() {
    this.home = false;
    this.errorState = false;
    this.requestShowList(this.retryIndex);
  }

  Page(e) {
      this.retryIndex = (e.pageIndex + 1);
      this.showsLoading = true;
      this.errorState = false;
      this.openSnackbar(`Page ${e.pageIndex + 1} is Loading`);

    this.subscribe = this.request.getShowsList((e.pageIndex + 1)).subscribe(data => {
      this.Shows = data;
      this.showsLoading = false;
      this.errorState = false;
   }, err => {
     this.openSnackbar(err);
     this.showsLoading = false;
     this.errorState = true;
   });

  }


  openSnackbar(msg:any) {
    this.UI.openSnackBar(msg)
  }


  favorite(id){
    console.log(id);
  }

  ngOnDestroy(): void {
    this.subscribe.unsubscribe();
    //this.typeAhead.unsubscribe();
  }
}


