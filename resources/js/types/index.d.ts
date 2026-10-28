import { User as AppUser } from './models';

export type User = AppUser;

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
};
