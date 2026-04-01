import Docker from "dockerode";

const docker = new Docker();

export async function listRunningContainers() {
  const containers = await docker.listContainers({ all: false });
  return containers.map((container) => ({
    id: container.Id,
    image: container.Image,
    names: container.Names,
    state: container.State,
  }));
}
