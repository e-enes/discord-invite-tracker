import MyClient from "../ts/class/MyClient";
import {register} from "../utils/slashsync";
import connection from "../data/connection";

export default {
    once: true,
    name: "ready",
    async execute(client: MyClient) {
        await register(client,
            client.register.map((command) => ({
                name: command.name,
                description: command.description,
                options: command.options,
                type: command.type,
            }))
        );
        await connection.executeQueries();

        client.user!.setActivity("Sene Bot");

        for (let i = 0; i < client.guilds.cache.size; i++) {
            const guild = client.guilds.cache.at(i)!;
            const guildInvites = await guild.invites.fetch();
            const code = new Map();
            guildInvites.each((inv) => code.set(inv.code, inv.uses));
            client.invites.set(guild.id, code);
        }
    }
};