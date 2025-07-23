function SetupWindow(){
  let w = window.innerWidth, h = window.innerHeight;
  let s = w < 991.98 ? 0 : 310;
  $('#main-container').height(h-60);
  // $('#layer-mid').width(w).height(h);
  $('#content-bottom').width(w).height(h-60);
  $('#content-mid').width(w-(s+10)).height(h);
  $('#sidebarMenu').height(h-60);
}
