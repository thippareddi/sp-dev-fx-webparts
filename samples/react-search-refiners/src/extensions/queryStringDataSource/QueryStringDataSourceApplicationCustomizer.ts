import { override } from                                               '@microsoft/decorators';
import { Log } from                                                    '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer
} from                                                                 '@microsoft/sp-application-base';
import * as strings from                                               'QueryStringDataSourceApplicationCustomizerStrings';
import { IDynamicDataController, IDynamicDataPropertyDefinition } from '@microsoft/sp-dynamic-data';
import { UrlHelper } from                                              '../../helpers/UrlHelper';

const LOG_SOURCE: string = 'QueryStringDataSourceApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IQueryStringDataSourceApplicationCustomizerProperties {
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class QueryStringDataSourceApplicationCustomizer
  extends BaseApplicationCustomizer<IQueryStringDataSourceApplicationCustomizerProperties> implements IDynamicDataController {

  private _searchQuery: string;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    // Check if there is an existing query parameter on loading (only on first load)
    const queryStringKeywords = UrlHelper.getQueryStringParam('q', window.location.href);

    if (queryStringKeywords) {
      this._searchQuery = queryStringKeywords;
    } else {
      this._searchQuery = '';
    }

    // Used as data source name
    this.manifest.alias = strings.Title;

    this._bindPushState();

    this.context.dynamicDataSourceManager.initializeSource(this);

    return Promise.resolve();
  }

  public getPropertyValue(propertyId: string) {
    switch (propertyId) {
      case 'queryStringQuery':
        return decodeURIComponent(this._searchQuery);

      default:
        throw new Error('Bad property id');
    }
  }

  public getPropertyDefinitions(): ReadonlyArray<IDynamicDataPropertyDefinition> {
    return [
      {
        id: 'queryStringQuery',
        title: strings.QQueryStringParameter
      }
    ];
  }

  /**
   * Adds a event listener on the default push state event and updates the data source property
   */
  private _bindPushState() {

    const _pushState = () => {
      const _defaultPushState = history.pushState;
      const _self = this;
      return function (data: any, title: string, url?: string | null) {
        
        const queryStringKeywords = UrlHelper.getQueryStringParam("q", url);

        if (queryStringKeywords && queryStringKeywords !== _self._searchQuery) {
          _self._searchQuery = queryStringKeywords;
          _self.context.dynamicDataSourceManager.notifyPropertyChanged('queryStringQuery');
        }

        // Call the original function with the provided arguments
        // This context is necessary for the context of the history change
        return _defaultPushState.apply(this, [data, title, url]);
      };
    };

    history.pushState = _pushState();
  }
}
