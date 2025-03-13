import { Grid } from "@mui/material";
import { SnapShotList } from "../../features/projects/components/SnapShotList.tsx";
import { SnapShot } from "../../features/projects/types/types.ts";

interface IShareLinkProps {
  itemId: number;
  snapShots: SnapShot[];
}

export const ShareLink = ({ itemId, snapShots }: IShareLinkProps) => {
  const fetchManifestInfo = async (hash: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CADDY_URL}/${hash}/workspace.json`,
      );
      if (!response.ok) throw new Error("Failed to fetch manifest info");
      const miradorWorkspace = await response.json();
      const date = new Date(miradorWorkspace.generated_at);
    } catch (error) {
      console.error("Error fetching manifest info:", error);
    }
  };

  return (
    <Grid container item spacing={2} sx={{ width: "100%" }}>
      <Grid item container xs={10} spacing={2} sx={{ width: "100%" }}>
        <Grid
          container
          item
          flexDirection="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%" }}
        >
          <Grid item sx={{ width: "100%" }}>
            <SnapShotList
              snapShots={
                [
                  {
                    title: "dummyTitle",
                    snapShotHash: "randomDummyHash",
                  },
                ] as never[] as SnapShot[]
              }
              itemId={itemId}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
