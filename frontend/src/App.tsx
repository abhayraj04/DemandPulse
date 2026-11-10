import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { NavTab } from './components/layout/Sidebar';
import { api } from './services/api';
import { DatasetStatus } from './types/api';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { TimeSeriesPage } from './pages/TimeSeriesPage';
import { DemandForecastingPage } from './pages/DemandForecastingPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductCatalogPage } from './pages/ProductCatalogPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { InsightsPage } from './pages/InsightsPage';
import { DatasetPage } from './pages/DatasetPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedStore, setSelectedStore] = useState<number | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<number | undefined>(undefined);
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);

  useEffect(() => {
    api.getDatasetStatus()
      .then(setDatasetStatus)
      .catch((err) => console.error('Failed to load initial dataset status:', err));
  }, [activeTab]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
      case 'sales':
        return (
          <SalesAnalyticsPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
      case 'timeseries':
        return (
          <TimeSeriesPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
      case 'forecasting':
        return (
          <DemandForecastingPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
      case 'inventory':
        return (
          <InventoryPage
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
          />
        );
      case 'catalog':
        return (
          <ProductCatalogPage
            onSelectProductForForecast={(itemId) => {
              setSelectedItem(itemId);
              setActiveTab('forecasting');
            }}
          />
        );
      case 'models':
        return (
          <ModelPerformancePage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
          />
        );
      case 'insights':
        return (
          <InsightsPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
      case 'dataset':
        return <DatasetPage />;
      case 'about':
        return <AboutPage />;
      default:
        return (
          <OverviewPage
            selectedStore={selectedStore}
            selectedItem={selectedItem}
            onStoreChange={setSelectedStore}
            onItemChange={setSelectedItem}
          />
        );
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      datasetAvailable={datasetStatus?.dataset_available ?? true}
      totalRecords={datasetStatus?.total_records ?? 913000}
    >
      {renderActivePage()}
    </Layout>
  );
};

export default App;
