/* eslint-disable sonarjs/no-duplicate-string */
import '@maicol07/material-web-additions/layout-grid/layout-grid.js';
import '@material/web/dialog/dialog.js';
import '@material/web/fab/branded-fab.js';
import '@material/web/fab/fab.js';
import '@material/web/iconbutton/standard-icon-button.js';

import {router} from '@maicol07/inertia-mithril';
import {
  FilterTextFieldInputEventDetail,
  SortButtonClickedEventDetail
} from '@maicol07/material-web-additions/data-table/lib/data-table-column.js';
import {
  mdiPlus,
  mdiRefresh
} from '@mdi/js';
import RecordsTable, {RecordsTableColumnAttributes} from '@osm/Components/DataTable/RecordsTable';
import AddEditRecordDialog from '@osm/Components/Dialogs/AddEditRecordDialog';
import DeleteRecordDialog, {DeleteRecordDialogAttributes} from '@osm/Components/Dialogs/DeleteRecordDialog';
import RecordDialog, {RecordDialogAttributes} from '@osm/Components/Dialogs/RecordDialog';
import MdIcon from '@osm/Components/MdIcon';
import Page, {PageAttributes} from '@osm/Components/Page';
import Model from '@osm/Models/Model';
import collect, {type Collection} from 'collect.js';
import {SortDirection} from 'coloquent';
import dayjs from 'dayjs';
import type {
  Children,
  Vnode,
  VnodeDOM
} from 'mithril';
import Stream from 'mithril/stream';
import {match} from 'ts-pattern';
import {Match} from 'ts-pattern/dist/types/Match';
import type {Class} from 'type-fest';

type RecordDialogVnode<M extends Model<any, any>, D extends RecordDialog<M>> = Vnode<RecordDialogAttributes<M>, D>;
type DeleteRecordDialogVnode<M extends Model<any, any>, D extends DeleteRecordDialog<M>> = Vnode<DeleteRecordDialogAttributes<M>, D>;

// noinspection JSUnusedLocalSymbols
/**
 * @abstract
 */
export default abstract class RecordsPage<
  M extends Model<any, any>,
  D extends AddEditRecordDialog<M> = AddEditRecordDialog<M>,
  DRD extends DeleteRecordDialog<M> = DeleteRecordDialog<M>
> extends Page {
  abstract modelType: Class<M> & typeof Model<any, any>;
  recordDialogType?: Class<D>;
  deleteRecordDialogType?: Class<DRD>;

  protected addRecordDialogSlug: string = '__add_record_dialog__' as const;

  protected records = new Map<string, M>();
  protected isTableLoading = true;
  protected recordDialogsStates: Map<string | M, Stream<boolean>> = new Map();
  protected deleteRecordsDialogStates: Map<string, Stream<boolean>> = new Map();
  protected recordPageRouteName?: string;

  protected readonlyRecords = false;
  protected refreshRecords = true;

  protected currentPageSize = 10;
  protected pageSizes = [10, 25, 50, 100];

  protected filters: Map<string, string> = new Map();
  protected sort: Map<string, SortDirection> = new Map([['id', SortDirection.ASC]]);
  private listenedFilterColumns: string[] = [];
  private listenedSortedColumns: string[] = [];

  oninit(vnode: Vnode<PageAttributes, this>) {
    super.oninit(vnode);
    // Redraw on a first load to call onbeforeupdate
    m.redraw();
  }

  async onbeforeupdate(vnode: VnodeDOM<PageAttributes, this>) {
    super.onbeforeupdate(vnode);

    if (this.refreshRecords) {
      this.refreshRecords = false;
      await this.loadRecords();
    }
  }

  async loadRecords() {
    this.isTableLoading = true;

    const response = await this.modelQuery().get();
    const data = response.getData();

    this.records.clear();
    if (data.length > 0) {
      for (const record of data) {
        this.records.set(record.getId()!, record);
      }
    }


    this.isTableLoading = false;
    m.redraw();
  }

  modelQuery() {
    let query = this.modelType.query<M>();

    for (const [attribute, value] of this.filters) {
      query = query.where(attribute, value);
    }
    for (const [attribute, value] of this.sort) {
      query = query.orderBy(attribute, value);
    }

    return query;
  }

  contents(vnode: Vnode<PageAttributes, this>) {
    return (
      <>
        <h2>{this.title}</h2>
        {this.table()}
        <div className="sticky-bottom" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {this.fab().values().all()}
        </div>
        <>
          {...this.recordDialogs().values<Children>().all()}
          {...this.deleteRecordDialogs().values<Children>().all()}
        </>
      </>
    );
  }

  fab(): Collection<Vnode> {
    const fabs = collect<Vnode>({
      refresh: (
        <md-fab id="refresh-records" ariaLabel={__('Aggiorna')} onclick={this.onRefreshRecordsButtonClicked.bind(this)}>
          <MdIcon icon={mdiRefresh} slot="icon"/>
        </md-fab>
      )
    });

    if ((this.recordDialogType || this.recordPageRouteName) && !this.readonlyRecords) {
      fabs.put(
        'add',
        <md-fab id="add-record" ariaLabel={__('Aggiungi')} onclick={this.onAddNewRecordButtonClicked.bind(this)}>
          <MdIcon icon={mdiPlus} slot="icon"/>
        </md-fab>
      );
    }
    return fabs;
  }

  table(): Children {
    return (
      <RecordsTable<M>
        records={this.records}
        paginated
        selectable
        currentPageSize={this.currentPageSize}
        pageSizes={JSON.stringify(this.pageSizes)}
        cols={this.tableColumns()}
        inProgress={this.isTableLoading}
        onTableRowClick={this.onTableRowClick.bind(this)}
        onDeleteRecordButtonClick={this.onDeleteRecordButtonClicked.bind(this)}
        onDeleteSelectedRecordsButtonClick={this.onDeleteSelectedRecordsButtonClicked.bind(this)}
        readonly={this.readonlyRecords}
        valueModifier={(value: unknown, attribute: string, record: M) => this.cellValueModifier(value, attribute, record)
          .otherwise(() => value)}/>
    );
  }

  abstract tableColumns(): Collection<Children> | Collection<RecordsTableColumnAttributes> | Collection<Children | RecordsTableColumnAttributes>;

  protected onTableRowClick(recordId: string) {
    if (!this.readonlyRecords) {
      const model = this.records.get(recordId)!;
      this.updateRecord(model);
    }
  }

  updateRecord(model: M) {
    if (this.recordPageRouteName) {
      router.visit(route(this.recordPageRouteName, {id: model.getId()!}));
      return;
    }

    const state = this.getRecordDialogState(model);
    state(true);
  }

  recordDialogs() {
    const collection = collect<RecordDialogVnode<M, D>>({});

    for (const [key, state] of this.recordDialogsStates) {
      // noinspection LocalVariableNamingConventionJS
      const RD = this.recordDialogType!;
      const record = key instanceof Model ? key : this.records.get(key);
      const vnodeKey = record?.getId() ?? (key as string);
      collection.put(vnodeKey, <RD key={vnodeKey} record={record} open={state}/>);
    }

    return collection;
  }

  deleteRecordDialogs() {
    const collection = collect<DeleteRecordDialogVnode<M, DRD>>({});

    for (const [key, state] of this.deleteRecordsDialogStates) {
      // noinspection LocalVariableNamingConventionJS
      const RD = this.deleteRecordDialogType ?? DeleteRecordDialog;
      const keyArray = key.split(',');
      const records = keyArray.map((recordId) => this.records.get(recordId)!);
      collection.put(key, <RD key={key} records={records} open={state}/>);
    }

    return collection;
  }

  onAddNewRecordButtonClicked() {
    if (this.recordDialogType) {
      this.openNewRecordDialog();
    } else if (this.recordPageRouteName) {
      router.visit(route(this.recordPageRouteName, {id: 'new'}));
    }
  }

  onRefreshRecordsButtonClicked() {
    this.refreshRecords = true;
  }

  onDeleteRecordButtonClicked(recordId: string, event: MouseEvent) {
    this.openDeleteRecordsDialog(this.records.get(recordId)!);
  }

  onDeleteSelectedRecordsButtonClicked(recordsIds: string[], event: MouseEvent) {
    this.openDeleteRecordsDialog(recordsIds.map((recordId) => this.records.get(recordId)!));
  }

  onupdate(vnode: VnodeDOM<PageAttributes, this>) {
    super.onupdate(vnode);

    const columns = this.element.querySelectorAll('md-data-table-column');
    for (const column of columns) {
      const attribute = column.dataset.modelAttribute!;
      if (!this.listenedFilterColumns.includes(attribute)) {
        column.addEventListener('filter', this.onFilter.bind(this));
        this.listenedFilterColumns.push(attribute);
      }

      if (!this.listenedSortedColumns.includes(attribute)) {
        column.addEventListener('sort', this.onColumnSort.bind(this));
        this.listenedSortedColumns.push(attribute);
      }
    }
  }

  protected onFilter(event: Event) {
    // TODO: Check if it's possible to use caseSensitiveness when filtering (currently enforces case sensitive)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {text, column, caseSensitive} = (event as CustomEvent<FilterTextFieldInputEventDetail>).detail;
    const modelAttribute = column.dataset.modelAttribute!;
    if (text === '') {
      this.filters.delete(modelAttribute);
    } else {
      this.filters.set(modelAttribute, text);
    }
    this.refreshRecords = true;
    m.redraw();
  }

  protected onColumnSort(event: Event) {
    const {column, isDescending} = (event as CustomEvent<SortButtonClickedEventDetail>).detail;
    const modelAttribute = column.dataset.modelAttribute!;
    this.sort.clear();
    this.sort.set(modelAttribute, isDescending ? SortDirection.DESC : SortDirection.ASC);
    this.refreshRecords = true;
    m.redraw();
  }

  openDeleteRecordsDialog(records: M | M[]) {
    const key = records instanceof Model ? records.getId()! : records.map((r) => r.getId()).join(',');
    let state = this.deleteRecordsDialogStates.get(key);

    if (!state) {
      state = Stream<boolean>();
      state.map((open) => {
        if (!open) {
          this.refreshRecords = true;
          m.redraw();
        }
        return open;
      });
      this.deleteRecordsDialogStates.set(key, state);
    }

    state(true);
  }

  openNewRecordDialog() {
    const state = this.getRecordDialogState(undefined, this.addRecordDialogSlug);
    state(true);
  }

  protected getRecordDialogState(record?: M, slug?: string) {
    const key: string = slug ?? record?.getId() ?? '';

    if (!this.recordDialogsStates.has(key)) {
      const state = Stream<boolean>(false);

      this.recordDialogsStates.set(key, state);

      state.map((open) => {
        if (!open) {
          this.isTableLoading = false;
          this.refreshRecords = true;
          m.redraw();
        }
        return open;
      });
    }

    return this.recordDialogsStates.get(key)!;
  }

  protected cellValueModifier(value: unknown, attribute: string, record: M): Match<string, unknown> {
    return match(attribute)
      .with('createdAt', 'updatedAt', () => dayjs(value as Date).format('DD/MM/YYYY HH:mm'));
  }
}
