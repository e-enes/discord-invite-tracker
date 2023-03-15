import {EmbedBuilder, GuildMember, TextChannel} from "discord.js";
import MyClient from "../ts/class/MyClient";
import antiBot from "../security/antiBot";
import inviteHimself from "../security/inviteHimself";
import youngAccount from "../security/youngAccount";
import invitesync from "../utils/invitesync";
import InviteStats from "../ts/interface/InviteStats";

export default {
    once: false,
    name: "guildMemberAdd",
    async execute(member: GuildMember, client: MyClient) {
        if (member.user.bot) return antiBot(member, client);
        const channel = await client.channels.fetch(process.env.CHANNEL_JOIN!) as TextChannel;

        member.guild.invites.fetch()
            .then(async (guildInvites) => {
                const invites = client.invites.get(member.guild.id);
                const invite = guildInvites.find((inv) => invites?.get(inv.code)! < inv.uses!)!;

                await guildInvites.each((inv) => invites?.set(inv.code, inv.uses!));
                await client.invites.set(member.guild.id, invites!);

                try {
                    const inviter = await invite.inviter!;
                    if (inviter.id === member.user.id) return inviteHimself(member, client, true);
                    if (Date.now() - member.user.createdTimestamp < 1000 * 60 * 60 * 24 * 10) return youngAccount(member, inviter, client, true);

                    await invitesync.setInviter(member.user.id, inviter.id, member.guild.id);
                    const invites: InviteStats = await invitesync.getInvites(inviter.id, member.guild.id);
                    const embed = new EmbedBuilder()
                        .setTitle(`${member.user.tag} joined!`)
                        .setDescription(
                            `
                            **Invited by**: ${inviter.tag}\n
                            **Who now has: ${invites.invites} invitations\n
                            **Account create**: <t:${Math.floor(member.user.createdTimestamp) / 1000}:R>\n
                            `
                        )
                        .setThumbnail(member.displayAvatarURL())
                        .setFooter({text: "Powered by Sene", iconURL: client.user!.displayAvatarURL()})
                        .setColor("DarkGreen")
                    return channel.send({embeds: [embed]});
                } catch (error) {
                    const embed = new EmbedBuilder()
                        .setTitle(`${member.user.tag} joined! (Error)`)
                        .setDescription(
                            `
                            **Invited by**: Unknow inviter\n
                            **Account create**: <t:${Math.floor(member.user.createdTimestamp) / 1000}:R>\n\n
                            **Console:** ${error}
                            `
                        )
                        .setThumbnail(member.displayAvatarURL())
                        .setFooter({text: "Powered by Sene", iconURL: client.user!.displayAvatarURL()})
                        .setColor("Red")
                    return channel.send({embeds: [embed]});
                }
            });
    }
}