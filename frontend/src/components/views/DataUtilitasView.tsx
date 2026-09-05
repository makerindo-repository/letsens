import React from 'react';
import { FasilitasView } from './FasilitasView';
import { ToiletBilik, FasilitasItem } from '../../types';

interface DataUtilitasViewProps {
  toilets: ToiletBilik[];
  utilitasList?: FasilitasItem[];
  fasilitasList?: FasilitasItem[];
  onAddUtilitas?: (item: Partial<FasilitasItem>) => void;
  onUpdateUtilitas?: (id: string, updated: Partial<FasilitasItem>) => void;
  onDeleteUtilitas?: (id: string) => void;
  onAddFasilitas?: (item: Partial<FasilitasItem>) => void;
  onUpdateFasilitas?: (id: string, updated: Partial<FasilitasItem>) => void;
  onDeleteFasilitas?: (id: string) => void;
}

export const DataUtilitasView: React.FC<DataUtilitasViewProps> = (props) => {
  return (
    <FasilitasView
      toilets={props.toilets}
      fasilitasList={props.fasilitasList || props.utilitasList}
      onAddFasilitas={props.onAddFasilitas || props.onAddUtilitas}
      onUpdateFasilitas={props.onUpdateFasilitas || props.onUpdateUtilitas}
      onDeleteFasilitas={props.onDeleteFasilitas || props.onDeleteUtilitas}
    />
  );
};
