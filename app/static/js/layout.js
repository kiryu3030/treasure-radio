function SetupWindow(){
  let w = window.innerWidth, h = window.innerHeight;
  // let s = w < 991.98 ? 0 : 310;
  $('#main-container').height(h);
  // $('#layer-mid').width(w).height(h);
  $('#content-bottom').width(w).height(h);
  $('#content-mid').width(w).height(h);
  // $('#content-mid').width(w).height(h);
  // $('#sidebarMenu').height(h);
}
