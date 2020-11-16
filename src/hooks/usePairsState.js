import { useReducer, useCallback } from "react";

const INIT = "INIT";
const UPDATE = "UPDATE";

const InitialState = {
  pairs: {},
  all: new Set(),
  bnb: new Set(),
  btc: new Set(),
  alts: new Set(),
  eth: new Set(),
  xrp: new Set(),
  trx: new Set(),
};

function parsePairsData(data) {
  const list = data.map((item) => item.s);
  const entities = data.reduce((obj, item) => {
    return { ...obj, [item.s]: { ...item } };
  }, {});
  return { list, entities };
}

function union(setA, setB) {
  let _union = new Set(setA);
  for (let elem of setB) {
    _union.add(elem);
  }
  return _union;
}

function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case INIT: {
      const { list, entities } = parsePairsData(payload);
      const bnbPairs = payload.filter((d) => d.pm === "BNB").map((d) => d.s);
      const btcPairs = payload.filter((d) => d.pm === "BTC").map((d) => d.s);
      const altPairs = payload.filter((d) => d.pm === "ALTS").map((d) => d.s);
      const xrpPairs = payload.filter((d) => d.q === "XRP").map((d) => d.s);
      const ethPairs = payload.filter((d) => d.q === "ETH").map((d) => d.s);
      const trxPairs = payload.filter((d) => d.q === "TRX").map((d) => d.s);

      return {
        ...state,
        pairs: {
          ...state.pairs,
          ...entities,
        },
        all: union(state.all, new Set(list)),
        bnb: union(state.bnb, new Set(bnbPairs)),
        btc: union(state.btc, new Set(btcPairs)),
        alts: union(state.alts, new Set(altPairs)),
        eth: union(state.eth, new Set(ethPairs)),
        xrp: union(state.xrp, new Set(xrpPairs)),
        trx: union(state.trx, new Set(trxPairs)),
      };
    }
    case UPDATE: {
      const { list, entities } = parsePairsData(payload);
      const bnbPairs = payload.filter((d) => d.pm === "BNB").map((d) => d.s);
      const btcPairs = payload.filter((d) => d.pm === "BTC").map((d) => d.s);
      const altPairs = payload.filter((d) => d.pm === "ALTS").map((d) => d.s);
      const xrpPairs = payload.filter((d) => d.q === "XRP").map((d) => d.s);
      const ethPairs = payload.filter((d) => d.q === "ETH").map((d) => d.s);
      const trxPairs = payload.filter((d) => d.q === "TRX").map((d) => d.s);

      return {
        ...state,
        pairs: {
          ...state.pairs,
          ...Object.keys(entities).reduce((newPairs, id) => {
            return {
              ...newPairs,
              [id]: {
                ...state.pairs[id],
                c: entities[id].c,
                o: entities[id].o,
              },
            };
          }, {}),
        },
        all: union(state.all, new Set(list)),
        bnb: union(state.bnb, new Set(bnbPairs)),
        btc: union(state.btc, new Set(btcPairs)),
        alts: union(state.alts, new Set(altPairs)),
        eth: union(state.eth, new Set(ethPairs)),
        xrp: union(state.xrp, new Set(xrpPairs)),
        trx: union(state.trx, new Set(trxPairs)),
      };
    }
    default: {
      return state;
    }
  }
}

export default function usePairsState() {
  const [state, dispatch] = useReducer(reducer, InitialState);
  const init = useCallback((data) => {
    dispatch({ type: INIT, payload: data });
  }, []);
  const update = useCallback((data) => {
    dispatch({ type: UPDATE, payload: data });
  }, []);

  return [state, init, update];
}
