(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {
    let storage;try{storage=root.localStorage;}catch(_){}
    root.GrokRuns=api.createSelector(storage);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='grok-maze-next-version-v1';
  function createSelector(storage){
    let fallbackNext=0;
    function nextVariant(){
      let selected=fallbackNext;
      try {
        const raw=storage?.getItem(KEY),value=raw===null||raw===undefined?null:Number(raw);
        if(value!==null&&Number.isInteger(value)&&value>=0&&value<3)selected=value;
      }catch(_){}
      fallbackNext=(selected+1)%3;
      try{storage?.setItem(KEY,String(fallbackNext));}catch(_){}
      return selected;
    }
    return{nextVariant};
  }
  return{KEY,createSelector};
});
