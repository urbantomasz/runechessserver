import { GameObject } from "./GameObject";
import { SpellManager } from "./SpellManager";
import { Tile } from "./Tile";
import { Unit } from "./Unit";

export interface ISpell {  
    // The function to be executed when the spell is cast.
    Cast: (castingUnit: Unit, target: GameObject, spellManager: SpellManager) => void;
    // A method to return an array of valid targets for the spell.
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): GameObject[];
  }

export class Castle implements ISpell{
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): GameObject[] {
        return spellManager.GetSwapCastables(castingUnit);
    }
    Cast(castingUnit: Unit, targetUnit: GameObject, spellManager: SpellManager){
        spellManager.CastSwapCastables(castingUnit, targetUnit as Unit);
    }
}

export class Sacrifice implements ISpell{
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        return spellManager.GetSacrificeCastables(castingUnit);
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastSacrifice(castingUnit, target as Unit);
    }
}

export class Shadowstep implements ISpell{
    private _adjacentsTiles: Map<Unit,Map<Unit,Tile>> = new Map<Unit, Map<Unit, Tile>>();
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        let shadowstepCastables = spellManager.GetShadowstepCastables(castingUnit);
        this._adjacentsTiles.set(castingUnit, shadowstepCastables.AdjacentTiles);
        return shadowstepCastables.Targets;
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastShadowstep(castingUnit, target as Unit, this._adjacentsTiles.get(castingUnit));
    }
}

export class Ressurection implements ISpell{
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Unit[] {
        return spellManager.GetResurrectionCastables(castingUnit);
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastRessurection(castingUnit, target as Unit);
    }
}

export class DestroyTile implements ISpell{
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
        return spellManager.GetUnoccupiedTiles();
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastDestroyTile(target as Tile);
    }
}

export class SpawnTile implements ISpell{
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
        return spellManager.GetDestroyedTiles();
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastSpawnTile(target as Tile);
    }
}

export class PowerStomp implements ISpell{
    public TilesBehindMap: Map<Unit,Map<Tile,Map<Unit,Tile>>> = new Map<Unit,Map<Tile,Map<Unit,Tile>>>();
    GetValidTargets(castingUnit: Unit, spellManager: SpellManager): Tile[] {
         const powerStompCastables = spellManager.GetPowerStompCastables(castingUnit);
         this.TilesBehindMap.set(castingUnit,powerStompCastables.TileToUnitToTileBehindMap);
         return powerStompCastables.Targets;
    }
    Cast(castingUnit: Unit, target: GameObject, spellManager: SpellManager){
        spellManager.CastPowerStomp(castingUnit, target as Tile, this.TilesBehindMap.get(castingUnit).get(target as Tile));
    }
}








    




 




  










// // if(currentUnit instanceof Druid){
    
// //     currentUnit.movePattern = [
// //         [0, 0, 1, 0, 0],
// //         [0, 0, 0, 0, 0],
// //         [1, 0, 0, 0, 1],
// //         [0, 0, 0, 0, 0],
// //         [0, 0, 1, 0, 0],
// //     ]

// //     sounds.CastMagic.play()
// //     endMove()
// //     return;
// // }

