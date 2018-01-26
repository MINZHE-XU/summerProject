const origin=[{id:0, north:-33.03900467904444, south:-34.03900467904444,west:150.4849853515625, east:151.4849853515625,rs:1 }
,{id:1, north:-33.33900467904444, south:-34.33900467904444,west:150.0849853515625, east:151.0849853515625,rs:1 }]
const origin1=[{id:0, north:90, south:-90,west:-180, east:180,rs:0}]
const mrs = (state =origin1, action) => {
  switch (action.type) {
    case 'FULLY_UPDATE_MRS':
    console.log(action)
      const rectangles=pointToRectangle(action.spots, action.size)
      console.log(rectangles)
      const sweepedData=sweepRectangle(rectangles)
      const sweepedMRs=sweepedDataToRectangle(sweepedData,0)
      return sweepedMRs
      break;
    case 'ADD_ONE_SPOT_MRS':
      console.log(action)
      const rectangle1=pointToRectangle([action.spots], action.size)
      const rec=rectangle1[0]
      console.log(rec)
      let storedMRs=state
      if (rec.west<rec.east){
        return addOneSpotMRS( storedMRs, rec)
      }else{
        //divided into two rectangles
        const rectangleLeft={ north:rec.north , south:rec.south,west:-180, east:rec.east, rs:rec.rs}
        const rectangleRight={ north:rec.north , south:rec.south,west:rec.west, east:180, rs:rec.rs}
        return addOneSpotMRS(addOneSpotMRS( storedMRs, rectangleLeft),rectangleRight )
      }
      break;
    case 'DELETE_ONE_SPOT_MRS':
      const rectangle2=pointToRectangle([action.spots], action.size)
      const rec2=rectangle2[0]
      console.log(rec2)
      let storedMRs2=state
      if (rec2.west<rec2.east){
        return deleteOneSpotMRS( storedMRs2, rec2)
      }else{
        const rectangleLeft1={ north:rec2.north , south:rec2.south,west:-180, east:rec2.east, rs:rec2.rs}
        const rectangleRight1={ north:rec2.north , south:rec2.south,west:rec2.west, east:180, rs:rec2.rs}
        return deleteOneSpotMRS(deleteOneSpotMRS( storedMRs2, rectangleLeft1),rectangleRight1 )
      }
      break;
    case 'RESET_MRS':
      return origin1
      break;

    default:
      return state
  }
}

export function deleteOneSpotMRS( mrs, rec){
  let effects=searchAffectedMRsLarge(mrs, rec)

  let storedMRs=effects.unAffectedMRs
  storedMRs=storedMRs.concat(updateOverlappingDelete( effects.affectedMRs, rec ))

// here is to handle very outside not overlapping MRs
  effects= updateOverappingWestEastDelete( effects.affectedMRsOutside,effects.unAffectedMRsOutside, {north:90,south:-90,west:rec.west,east:rec.east} )
  storedMRs=storedMRs.concat(effects.unAffectedMRs).concat(effects.affectedMRs)

  return storedMRs
}


export function updateOverlappingDelete( mrs, rec){
  let storedMRs=[]
  let effects=searchAffectedMRs(mrs, rec)

  storedMRs=storedMRs.concat(effects.affectedMRs.map(function(mr){
    return {north:mr.north, south:mr.south, west:mr.west, east:mr.east, rs:mr.rs-rec.rs }
  }))
  //inside changed rectangles
  //console.log( storedMRs)
  //outside unaffected
  //console.log( effects.unAffectedMRs)
  //cut vertically
  effects= cutVertically(storedMRs, effects.unAffectedMRs, rec)
  effects= updateOverappingNorthSouthDelete( effects.affectedMRs,  effects.unAffectedMRs, rec)
  effects= updateOverappingWestEastDelete(  effects.affectedMRs, effects.unAffectedMRs, rec)
  storedMRs=effects.affectedMRs.concat(effects.unAffectedMRs)
  //let effects= updateOverappingWestEast( mrs , rec)
  //storedMRs=storedMRs.concat(effects.unAffectedMRs)

  return storedMRs
}


//affs: the center affected mrs
//mrs: outside border unaffected mrs
export function cutVertically(affs, mrs, rec){

  let northMRs=[]
  let southMRs=[]
  let lrMRs=[]
  let centerAffs=affs
  let stillCenter=affs

// cut center rectangles
    mrs.map(function(mr, index){
      centerAffs=stillCenter
      stillCenter=[]
      centerAffs.map(function(aff){
        if(rec.west<=mr.west && mr.east<=rec.east &&  mr.south>=rec.north){
          if ( aff.west<mr.west && mr.west< aff.east &&  mr.south===aff.north && mr.rs===aff.rs ){
                if ( aff.west<mr.east && mr.east< aff.east &&  mr.south===aff.north && mr.rs===aff.rs ){
                  //       |               |  aff
                  //           |     |     mr
                  stillCenter=stillCenter.concat([
                    { north:aff.north , south:aff.south, west:aff.west, east:mr.west, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.west, east:mr.east, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.east, east:aff.east, rs:aff.rs}])
                }else{
                  //       |               |  aff
                  //           |                    |     mr
                  stillCenter=stillCenter.concat([
                    { north:aff.north , south:aff.south, west:aff.west, east:mr.west, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.west, east:aff.east, rs:aff.rs}])
                }

                //       |               |  aff
                //    |     ?     mr
            }else if(aff.west>=mr.west &&  mr.south===aff.north && mr.rs===aff.rs ){
              if ( aff.west<mr.east && mr.east< aff.east &&  mr.south===aff.north && mr.rs===aff.rs ){
                //         |             |  aff
                //     |      |     mr
                stillCenter=stillCenter.concat([
                  { north:aff.north , south:aff.south, west:aff.west, east:mr.east, rs:aff.rs},
                  { north:aff.north , south:aff.south, west:mr.east, east:aff.east, rs:aff.rs}])
              }else{
                //                |         |  aff
                //           |                    |     mr
                stillCenter=stillCenter.concat([aff])
              }
            }else {
              //nothing changes, donnot have relationships
              stillCenter=stillCenter.concat([aff])
            }
        }

        //       |               |  aff
        //           |     ?     mr
        else if(rec.west<=mr.west && mr.east<=rec.east &&  mr.north<=rec.south){
          if ( aff.west<mr.west && mr.west< aff.east &&  mr.north===aff.south && mr.rs===aff.rs ){
                if ( aff.west<mr.east && mr.east< aff.east &&   mr.north===aff.south && mr.rs===aff.rs ){
                  //       |               |  aff
                  //           |     |     mr
                  stillCenter=stillCenter.concat([
                    { north:aff.north , south:aff.south, west:aff.west, east:mr.west, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.west, east:mr.east, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.east, east:aff.east, rs:aff.rs}])
                }else{
                  //       |               |  aff
                  //           |                    |     mr
                  stillCenter=stillCenter.concat([
                    { north:aff.north , south:aff.south, west:aff.west, east:mr.west, rs:aff.rs},
                    { north:aff.north , south:aff.south, west:mr.west, east:aff.east, rs:aff.rs}])
                }

                //       |               |  aff
                //    |     ?     mr
            }else if(aff.west>=mr.west &&   mr.north===aff.south && mr.rs===aff.rs ){
              if ( aff.west<mr.east && mr.east< aff.east &&   mr.north===aff.south  && mr.rs===aff.rs ){
                //         |             |  aff
                //     |      |     mr
                stillCenter=stillCenter.concat([
                  { north:aff.north , south:aff.south, west:aff.west, east:mr.east, rs:aff.rs},
                  { north:aff.north , south:aff.south, west:mr.east, east:aff.east, rs:aff.rs}])
              }else{
                //                |         |  aff
                //           |                    |     mr
                stillCenter=stillCenter.concat([aff])
              }
            }else {
              //nothing changes, donnot have relationships
              stillCenter=stillCenter.concat([aff])
            }
        }else{
          stillCenter=stillCenter.concat([aff])
        }
      return 1
      })
    return 1
  })
//  done  cut center retangles
centerAffs=stillCenter
let mrX=[]
mrs.map(function(mr, index){
  mrX=[]
  if(  rec.west<=mr.west && mr.east<=rec.east &&  mr.south>=rec.north){
  centerAffs.map(function(aff){
  if ( mr.west<aff.west && aff.west< mr.east &&  aff.north===mr.south && aff.rs===mr.rs ){
    mrX = mrX.concat([aff.west])
  }
  if ( mr.west<aff.east && aff.east< mr.east  &&  aff.north===mr.south && aff.rs===mr.rs ){
    mrX = mrX.concat([aff.east])
  }
  return 1
  })

  mrX = mrX.concat([mr.east,mr.west ])
  mrX =Array.from(new Set(mrX));
  mrX.sort(function (x, y) {if (x < y) {return -1;}if (x > y) {return 1;}return 0;});

  for (let i=0; i<mrX.length-1;i++){
    northMRs=northMRs.concat([{ north:mr.north , south:mr.south, west:mrX[i], east:mrX[i+1], rs:mr.rs}])
  }
}else if(  rec.west<=mr.west && mr.east<=rec.east &&  mr.north<=rec.south){
      centerAffs.map(function(aff){
      if ( mr.west<aff.west && aff.west< mr.east &&  aff.south===mr.north && aff.rs===mr.rs ){
        mrX = mrX.concat([aff.west])
      }
      if ( mr.west<aff.east && aff.east< mr.east  &&  aff.south===mr.north && aff.rs===mr.rs ){
        mrX = mrX.concat([aff.east])
      }
      return 1
      })

      mrX = mrX.concat([mr.east,mr.west ])
      mrX =Array.from(new Set(mrX));
      mrX.sort(function (x, y) {if (x < y) {return -1;}if (x > y) {return 1;}return 0;});
      for (let i=0; i<mrX.length-1;i++){
        northMRs=northMRs.concat([{ north:mr.north , south:mr.south, west:mrX[i], east:mrX[i+1], rs:mr.rs}])
      }
  }else{
    lrMRs=lrMRs.concat([mr])
  }

  return 1
})



//northMRs.concat(southMRs).concat(lrMRs)
  return {affectedMRs:stillCenter, unAffectedMRs:northMRs.concat(southMRs).concat(lrMRs)}
}
//affs: the center affected mrs
//mrs: outside border unaffected mrs
export function updateOverappingWestEastDelete(affs, mrs, rec){
  let GluedMRs=[]
  let unAffectedMRs=[]
  let centerAffs=affs
  let stillCenter=affs
  mrs.map(function(mr){
    if(  rec.east<=mr.west ){
      centerAffs=stillCenter
      stillCenter=[]
      centerAffs.map(function(aff, index){
        if ( aff.north===mr.north && aff.south===mr.south &&  aff.east===mr.west && aff.rs===mr.rs){
          GluedMRs=GluedMRs.concat([{ north:mr.north , south:mr.south, west:aff.west, east:mr.east, rs:mr.rs}])
        }else {
          stillCenter=stillCenter.concat([aff])
        }
      })
      if(stillCenter.length===centerAffs.length){ GluedMRs=GluedMRs.concat([mr])}
      return 1
    }else {
      unAffectedMRs=unAffectedMRs.concat([mr])
    }
    return 1
  })

    let mrss= unAffectedMRs
    let affss= GluedMRs.concat(stillCenter)
    GluedMRs=[]
    unAffectedMRs=[]
    centerAffs=affss
    stillCenter=affss
    mrss.map(function(mr){
      if(  mr.east<=rec.west ){
        centerAffs=stillCenter
        stillCenter=[]
        centerAffs.map(function(aff, index){

          if (  aff.north===mr.north && aff.south===mr.south &&  aff.west===mr.east && aff.rs===mr.rs ){
            //console.log("aaaa")
            //console.log(aff)
            //console.log(mr)
            GluedMRs=GluedMRs.concat([ { north:mr.north , south:mr.south, west:mr.west, east:aff.east, rs:mr.rs}])
          }else {
            stillCenter=stillCenter.concat([aff])
          }
        })
        if(stillCenter.length===centerAffs.length){ GluedMRs=GluedMRs.concat([mr])}
        return 1
      }else {
        unAffectedMRs=unAffectedMRs.concat([mr])
      }
      return 1
    })

  console.log( {affectedMRs:GluedMRs.concat(stillCenter), unAffectedMRs:unAffectedMRs })
  return {affectedMRs:GluedMRs.concat(stillCenter), unAffectedMRs:unAffectedMRs }
}

//affs: the center affected mrs
//mrs: outside border unaffected mrs
export function updateOverappingNorthSouthDelete(affs, mrs, rec){
  let GluedMRs=[]
  let unAffectedMRs=[]
  let centerAffs=affs
  let stillCenter=affs
  mrs.map(function(mr){
    if(  rec.west<=mr.west && mr.east<=rec.east &&  mr.south>=rec.north){
      centerAffs=stillCenter
      stillCenter=[]
      centerAffs.map(function(aff, index){
        if ( aff.west===mr.west && aff.east===mr.east &&  aff.north===mr.south && aff.rs===mr.rs){

          GluedMRs=GluedMRs.concat([{ north:mr.north , south:aff.south, west:aff.west, east:aff.east, rs:mr.rs}])
        }else {
          stillCenter=stillCenter.concat([aff])
        }
      })
      if(stillCenter.length===centerAffs.length){ GluedMRs=GluedMRs.concat([mr])}
      return 1
    }else {
      unAffectedMRs=unAffectedMRs.concat([mr])
    }
    return 1
  })

    let mrss= unAffectedMRs
    let affss= GluedMRs.concat(stillCenter)
    GluedMRs=[]
    unAffectedMRs=[]
    centerAffs=affss
    stillCenter=affss
    mrss.map(function(mr){
      if(  rec.west<=mr.west && mr.east<=rec.east &&  mr.north<=rec.south){
        centerAffs=stillCenter
        stillCenter=[]
        centerAffs.map(function(aff, index){
          if ( aff.west===mr.west && aff.east===mr.east &&  aff.south===mr.north && aff.rs===mr.rs){
            //console.log("aaaa")
            //console.log(aff)
            //console.log(mr)
            GluedMRs=GluedMRs.concat([{ north:aff.north , south:mr.south, west:aff.west, east:aff.east, rs:mr.rs}])
          }else {
            stillCenter=stillCenter.concat([aff])
          }
        })
        if(stillCenter.length===centerAffs.length){ GluedMRs=GluedMRs.concat([mr])}
        return 1
      }else {
        unAffectedMRs=unAffectedMRs.concat([mr])
      }
      return 1
    })

  console.log( {affectedMRs:GluedMRs.concat(stillCenter), unAffectedMRs:unAffectedMRs })
  return {affectedMRs:GluedMRs.concat(stillCenter), unAffectedMRs:unAffectedMRs }
}



//cut left and right unaffected partitions first, then add rs for the overlapped partions
export function addOneSpotMRS( mrs, rec){
  let effects=searchAffectedMRs(mrs, rec)
  //console.log( effects)
  let storedMRs=effects.unAffectedMRs
  storedMRs=storedMRs.concat(updateOverlappingAdd( effects.affectedMRs, rec ))
  //console.log(storedMRs)
  return storedMRs
}

export function updateOverlappingAdd( mrs, rec){
  let storedMRs=[]
  let effects= updateOverappingWestEast( mrs , rec)
  storedMRs=storedMRs.concat(effects.unAffectedMRs)
  effects= updateOverappingNorthSouth(effects.affectedMRs, rec)
  storedMRs=storedMRs.concat(effects.unAffectedMRs)
  storedMRs=storedMRs.concat(effects.affectedMRs.map(function(mr){
    return {north:mr.north, south:mr.south, west:mr.west, east:mr.east, rs:mr.rs+rec.rs }
  }))
  return storedMRs
}

export function updateOverappingNorthSouth( mrs, rec){
  let toDivide=[]
  let unAffectedMRs=[]
  mrs.map(function(mr){
    if(mr.south<rec.north && rec.north<mr.north ){
      unAffectedMRs=unAffectedMRs.concat([{ north:mr.north, south:rec.north,west:mr.west, east:mr.east, rs:mr.rs}])
      toDivide=toDivide.concat([{ north:rec.north , south:mr.south,west:mr.west, east:mr.east, rs:mr.rs}])
    }else{
      toDivide=toDivide.concat([mr])
    }
    return 1
  })
  let temp = toDivide
  toDivide=[]
  temp.map(function(mr){
    if(mr.south<rec.south && rec.south<mr.north ){
      unAffectedMRs=unAffectedMRs.concat([{ north:rec.south, south:mr.south,west:mr.west, east:mr.east,rs:mr.rs}])
      toDivide=toDivide.concat([{ north:mr.north, south:rec.south,west:mr.west, east:mr.east, rs:mr.rs}])
    }else{
      toDivide=toDivide.concat([mr])
    }
    return 1
  })
  return {affectedMRs:toDivide, unAffectedMRs:unAffectedMRs }
}

export function updateOverappingWestEast( mrs , rec){
  let toDivide=[]
  let unAffectedMRs=[]
  mrs.map(function(mr){
    if(mr.west<rec.west && rec.west<mr.east ){
      unAffectedMRs=unAffectedMRs.concat([{ north:mr.north, south:mr.south,west:mr.west, east:rec.west,rs:mr.rs}])
      toDivide=toDivide.concat([{ north:mr.north, south:mr.south,west:rec.west, east:mr.east, rs:mr.rs}])
    }else{
      toDivide=toDivide.concat([mr])
    }
    return 1
  })
  let temp = toDivide
  toDivide=[]
  temp.map(function(mr){
    if(mr.west<rec.east && rec.east<mr.east ){
      unAffectedMRs=unAffectedMRs.concat([{ north:mr.north, south:mr.south,west:rec.east, east:mr.east,rs:mr.rs}])
      toDivide=toDivide.concat([{ north:mr.north, south:mr.south,west:mr.west, east:rec.east, rs:mr.rs}])
    }else{
      toDivide=toDivide.concat([mr])
    }
    return 1
  })

return {affectedMRs:toDivide, unAffectedMRs:unAffectedMRs }
}




export function searchAffectedMRsLarge(mrs, rec){

  let affectedMRs=[]
  let unAffectedMRs=[]
  let affectedMRsOutside=[]
  let unAffectedMRsOutside=[]
  mrs.map(function(mr){
    //common case
    //!(rec.west>=mr.east || rec.east<=mr.west)
    if(!(rec.west>mr.east || rec.east<mr.west || rec.north<mr.south || rec.south>mr.north )){
      affectedMRs=affectedMRs.concat([mr]);
    }else{
      if (rec.west===mr.west || rec.east===mr.east){
        affectedMRsOutside=affectedMRsOutside.concat([mr]);
      }else if(rec.west===mr.east || rec.east===mr.west){
        unAffectedMRsOutside=unAffectedMRsOutside.concat([mr]);
      }else{
        unAffectedMRs=unAffectedMRs.concat([mr]);
      }
    }
  });
  affectedMRsOutside=Array.from(new Set(affectedMRsOutside));

  return {affectedMRs:affectedMRs, unAffectedMRs:unAffectedMRs, affectedMRsOutside:affectedMRsOutside, unAffectedMRsOutside:unAffectedMRsOutside};
}

export function searchAffectedMRs(mrs, rec){

  let affectedMRs=[]
  let unAffectedMRs=[]
  mrs.map(function(mr){
    //common case
    //!(rec.west>=mr.east || rec.east<=mr.west)
    if(!(rec.west>=mr.east || rec.east<=mr.west || rec.north<=mr.south || rec.south>=mr.north )){
      affectedMRs=affectedMRs.concat([mr]);
    }else{
      unAffectedMRs=unAffectedMRs.concat([mr]);
    }
  });
  return {affectedMRs:affectedMRs, unAffectedMRs:unAffectedMRs };
}

//fully update functions
/**
      console.log(action)
      console.log(action.spots)
      console.log(action.size)
      console.log("rectangles")
      console.log(rectangles)
      console.log("sweepedData")
      console.log(sweepedData)
      console.log("sweepedMRs")
      console.log(sweepedMRs)
      **/
export function sweepedDataToRectangle(sweepedData ,limit){
  let mrs=[];
  let nextTodoId=0;
  if (sweepedData.length===0){
    return mrs
  }else{
    for(let i=0; i<sweepedData.length;i++){
      let westValue= sweepedData[i].xValue;
      let  eastValue;
      if (i===sweepedData.length-1){
        eastValue= sweepedData[0].xValue;
      }else{
        eastValue= sweepedData[i+1].xValue;
      }

      let yGroup= getYGroup(sweepedData[i].group)
      //console.log(sweepedData[i].group)
      yGroup.map(function(ay){
        if(ay.rs>=limit){
          mrs=mrs.concat([{id:nextTodoId++,
            north: ay.northValue,
            south: ay.southValue,
            east: eastValue,
            west: westValue,
            rs:ay.rs}])
          return 1;
        }

      });


    }
    return mrs
  }
}
export function getYGroup(sweepedDataGroup){
  //sweepedDataGroup.sort(function (x, y) {if (x.y < y.y) {return -1;}if (x.y > y.y) {return 1;}return 0;});
  //xs=Array.from(new Set(xs));
  let yValues=sweepedDataGroup.map(function(sweepedDataGroup1){
    return sweepedDataGroup1.y;
  });
  //contain all the rectangle y value
  yValues=yValues.concat([-90,90]);
  yValues.sort(function (x, y) {if (x < y) {return -1;}if (x > y) {return 1;}return 0;});
  yValues=Array.from(new Set(yValues));
  //console.log(yValues)
  let tempRS=0;
  let yGroup=[];
  //become y with rs
  for (let i=0; i<yValues.length-1; i++){
    sweepedDataGroup.map(function(sweepedData){
      if(sweepedData.y>=yValues[i] && sweepedData.y<yValues[i+1]){
        switch (sweepedData.type){
          case "down":
          tempRS=tempRS+1;
          break;
          case "up":
          tempRS=tempRS-1;
          break;
          default:
        }
      }
      return 1;
    });
    yGroup= yGroup.concat(
      [{ southValue:yValues[i] ,
        northValue: yValues[i+1],
        rs: tempRS
      }]
    );
  }
  return yGroup
}



export function sweepRectangle(rectangles){
  let nextTodoId = 0;
  let sweepedStore=[];
  let xs = rectangles.map(function(rectangle){
    return [rectangle.west,rectangle.east];
  });
  if (xs.length>=1){
    xs = xs.reduce(function(a, b) {
      return a.concat(b);
    });
  }
  //kick duplicated
  xs=Array.from(new Set(xs));
  // xs is each x value while sweep
  //group is each y points owned by each x
  xs.sort(function (x, y) {if (x < y) {return -1;}if (x > y) {return 1;}return 0;});
  let groups= xs.map(function(x){
    let forX= rectangles.map(function(rectangle){
      if (rectangle.west<rectangle.east){
        //common case
        if(x>=rectangle.west && x<rectangle.east){
          return [{y:rectangle.south,type:"down"},{y:rectangle.north,type:"up"}];
        }else{
          return [];
        }

      }else{
        //other case
        if(x>=rectangle.west || x<rectangle.east){
          return [{y:rectangle.south,type:"down"},{y:rectangle.north,type:"up"}];
        }else{
          return [];
        }
      }

    });
    if (forX.length >=1){
      forX = forX.reduce(function(a, b) {
        return a.concat(b);
      });
    }
    return {xValue:x, group:forX};
  })
  //console.log("xs")
  //console.log(xs)

  return groups
}


export function pointToRectangle(spots, size){
  let nextTodoId = 0
  const rectangles = spots.map(function(spot){
    let northValue=spot.lat+size.height/2
    if(northValue>90){northValue=90}
    let southValue=spot.lat-size.height/2
    if(southValue<-90){southValue=-90}
    let westValue=spot.lng-size.length/2
    if(westValue<=-180){westValue=westValue+360}
    let eastValue=spot.lng+size.length/2
    if(eastValue>180){eastValue=eastValue-360}
    return {id:nextTodoId++,
      north: northValue,
      south: southValue,
      east: eastValue,
      west: westValue,
      rs:1};
  });
  return rectangles
}

export default mrs
