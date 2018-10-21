import {Inject} from '@angular/core';
import {Component,OnInit,OnDestroy} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {MatDialog,MatDialogRef,MAT_DIALOG_DATA} from '@angular/material';
import {ElectronService} from '../../../services/electron.service';
import { SearchService } from 'src/app/services/search.service';
import { TorrentSearchApiService } from 'src/app/services/torrent-search-api.service';

@Component( {
  selector: 'show-dload-dialog',
    templateUrl: './show-download-dialog.html',
    styleUrls: ['./../show-download-dialog.scss']
}

) export class ShowDownloadDialogComponent implements OnInit,
OnDestroy {
  errorState: boolean=false;
  loadingShows:boolean = true;
  loadingError:boolean = false;
  loading = true;
  episodes;
  Id;
  length;
  completeEpisodes: any;

  constructor(public dialogRef: MatDialogRef<ShowDownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private snackBar: MatSnackBar,
    private electron: ElectronService,
    private request: SearchService,
    private torrent: TorrentSearchApiService) {}

  ngOnInit(): void {

    setTimeout(() => {
      this.requestShowEpisodes(50, 1);
    }, 1000); 

    setTimeout(() => {
      this.showCompleteEpisodes(this.data.seasons);
    }, 3000); 

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  requestShowEpisodes(size, page) {
    // start spinner
    this.loading=true;
    this.errorState=false;

    this.request.getShowEpisopse(this.data.imdbCode, size, page) .subscribe((data)=> {
      this.episodes=data['torrents'];
      this.length=data['torrents_count'];
      //   val = this.length;
      this.loading=false;
    }
    , err=> {
      console.log(err);
      this.showError(err);
      this.errorState=true;
      this.loading=false;
    });
  }

   showCompleteEpisodes(seasons=this.data.seasons) {
    this.loadingShows = true;
    this.loadingError = false;
    this.torrent.getAll(`${this.data.title} complete`, seasons*4)
    .then(res=> {
      console.log(res);
       this.completeEpisodes = res;
       this.loadingError = false;
       this.loadingShows = false;
    }).catch( err => {
      this.showError(err);
      this.loadingError = true;
      this.loadingShows = false;
    })
  }


  page(e) {
    this.errorState=false;
    this.loading=true;
    this.request.getShowEpisopse(this.data.imdbCode, e.pageSize, (e.pageIndex + 1)) .subscribe((data)=> {
      this.episodes=data['torrents'];
      this.loading=false;
    }
    , err=> {
      this.showError(err);
      this.errorState=true;
      this.loading=false;
    });
  }




  download(url, snkMsg) {
    this.electron.shell.openExternal(url);
    this.openSnackBar(snkMsg);
  }

  downloadTorrent(item){
    this.torrent.downloadMagnet(item).catch(
      res => {
        this.openSnackBar(res);
      }
    );
  }

  showError(err) {
    this.snackBar.open(err);
  }

  openSnackBar(title: string) {
    this.snackBar.open(`Downloading ${title}`, 'close');
  }


  retry() {
    this.requestShowEpisodes(50, 1);
  }

  ngOnDestroy() {
    // this.request.getShowEpisopse(0 ,0,0).unsubscribe();
    //  this.episodes.unsubscribe();
  }

}