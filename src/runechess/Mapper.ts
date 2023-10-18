import { AvailableMovesDTO, AvailableCastsDTO, UnitDTO, TileDTO } from "./DTOs";
import { AvailableCasts } from "./SpellManager";
import { Tile } from "./Tile";
import { Unit } from "./Unit";
import { AvailableMoves } from "./Validator";

export class Mapper {
  public static MapMovesToDTO(
    availableMovesMap: Map<Unit, AvailableMoves>
  ): Map<string, AvailableMovesDTO> {
    const availableMovesDTO = new Map<string, AvailableMovesDTO>();

    for (const [key, value] of availableMovesMap) {
      let availableMoves = new AvailableMovesDTO();
      availableMoves.Tiles = value.Tiles.map((x) => x.id);
      availableMoves.Units = value.Units.map((x) => x.id);
      // availableMoves.Units = value.Units.map((x) => {
      //   var unitTargetDTO = {} as UnitTargetDTO;
      //   unitTargetDTO.Id = x.id;
      //   unitTargetDTO.IsEnPassant =
      //     x instanceof Peasant && x.isEnPassant ? true : false;
      //   return unitTargetDTO;
      // });
      availableMoves.EnPassant = value.EnPassant?.id;
      availableMovesDTO.set(key.id, availableMoves);
    }

    return availableMovesDTO;
  }

  public static MapCastsToDTO(
    availableCastsMap: Map<Unit, AvailableCasts>
  ): Map<string, AvailableCastsDTO> {
    const availableCastsDTO = new Map<string, AvailableCastsDTO>();

    for (const [key, value] of availableCastsMap) {
      let availableCasts = new AvailableCastsDTO();
      availableCasts.Targets = value.Targets.map((x) => x.id);
      availableCastsDTO.set(key.id, availableCasts);
    }

    return availableCastsDTO;
  }

  public static MapUnitsToDTO(units: Array<Unit>): Array<UnitDTO> {
    return units.map((x) => new UnitDTO(x));
  }

  public static MapTilesToDTO(tiles: Tile[][]): Array<TileDTO> {
    return tiles.flat().map((x) => new TileDTO(x));
  }
}
