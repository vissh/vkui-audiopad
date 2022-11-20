import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { TypeRootState } from '../store/store';

export const useTypedSelector: TypedUseSelectorHook<TypeRootState> = useSelector;
