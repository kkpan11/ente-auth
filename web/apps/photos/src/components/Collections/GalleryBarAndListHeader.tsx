import { AllAlbums } from "components/Collections/AllAlbums";
import {
    CollectionShare,
    type CollectionShareProps,
} from "components/Collections/CollectionShare";
import { TimeStampListItem } from "components/FileList";
import { useModalVisibility } from "ente-base/components/utils/modal";
import type { Collection } from "ente-media/collection";
import {
    GalleryBarImpl,
    type GalleryBarImplProps,
} from "ente-new/photos/components/gallery/BarImpl";
import { PeopleHeader } from "ente-new/photos/components/gallery/PeopleHeader";
import {
    collectionsSortBy,
    haveOnlySystemCollections,
    PseudoCollectionID,
    type CollectionsSortBy,
    type CollectionSummaries,
} from "ente-new/photos/services/collection-summary";
import { getData, removeData } from "ente-shared/storage/localStorage";
import { includes } from "ente-utils/type-guards";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { sortCollectionSummaries } from "services/collectionService";
import {
    FilesDownloadProgressAttributes,
    isFilesDownloadCancelled,
    isFilesDownloadCompleted,
} from "../FilesDownloadProgress";
import { AlbumCastDialog } from "./AlbumCastDialog";
import {
    CollectionHeader,
    type CollectionHeaderProps,
} from "./CollectionHeader";

type GalleryBarAndListHeaderProps = Omit<
    GalleryBarImplProps,
    | "collectionSummaries"
    | "onSelectCollectionID"
    | "collectionsSortBy"
    | "onChangeCollectionsSortBy"
    | "onShowAllAlbums"
> & {
    /**
     * When `true`, the bar is be hidden altogether.
     */
    shouldHide: boolean;
    barCollectionSummaries: CollectionSummaries;
    activeCollection: Collection;
    setActiveCollectionID: (collectionID: number) => void;
    setPhotoListHeader: (value: TimeStampListItem) => void;
    filesDownloadProgressAttributesList: FilesDownloadProgressAttributes[];
} & Pick<
        CollectionHeaderProps,
        "setFilesDownloadProgressAttributesCreator" | "onRemotePull"
    > &
    Pick<
        CollectionShareProps,
        "user" | "emailByUserID" | "shareSuggestionEmails" | "setBlockingLoad"
    >;

/**
 * The gallery bar, the header for the list items, and state for any associated
 * dialogs that might be triggered by actions on either the bar or the header..
 *
 * This component manages the sticky horizontally scrollable bar shown at the
 * top of the gallery, AND the non-sticky header shown below the bar, at the top
 * of the actual list of items.
 *
 * These are disparate views - indeed, the list header is not even a child of
 * this component but is instead proxied via {@link setPhotoListHeader}. Still,
 * having this intermediate wrapper component allows us to move some of the
 * common concerns shared by both the gallery bar and list header (e.g. some
 * dialogs that can be invoked from both places) into this file instead of
 * cluttering the already big gallery component.
 *
 * TODO: Once the gallery code is better responsibilitied out, consider moving
 * this code back inline into the gallery.
 */
export const GalleryBarAndListHeader: React.FC<
    GalleryBarAndListHeaderProps
> = ({
    shouldHide,
    mode,
    onChangeMode,
    user,
    barCollectionSummaries: toShowCollectionSummaries,
    activeCollection,
    activeCollectionID,
    setActiveCollectionID,
    setBlockingLoad,
    people,
    activePerson,
    emailByUserID,
    shareSuggestionEmails,
    onRemotePull,
    onSelectPerson,
    setPhotoListHeader,
    filesDownloadProgressAttributesList,
    setFilesDownloadProgressAttributesCreator,
}) => {
    const { show: showAllAlbums, props: allAlbumsVisibilityProps } =
        useModalVisibility();
    const { show: showCollectionShare, props: collectionShareVisibilityProps } =
        useModalVisibility();
    const { show: showCollectionCast, props: collectionCastVisibilityProps } =
        useModalVisibility();

    const [collectionsSortBy, setCollectionsSortBy] =
        useCollectionsSortByLocalState("updation-time-desc");

    const shouldBeHidden = useMemo(
        () =>
            shouldHide ||
            (haveOnlySystemCollections(toShowCollectionSummaries) &&
                activeCollectionID === PseudoCollectionID.all),
        [shouldHide, toShowCollectionSummaries, activeCollectionID],
    );

    const sortedCollectionSummaries = useMemo(
        () =>
            sortCollectionSummaries(
                [...toShowCollectionSummaries.values()],
                collectionsSortBy,
            ),
        [collectionsSortBy, toShowCollectionSummaries],
    );

    const isActiveCollectionDownloadInProgress = useCallback(() => {
        const attributes = filesDownloadProgressAttributesList.find(
            (attr) => attr.collectionID === activeCollectionID,
        );
        return (
            attributes &&
            !isFilesDownloadCancelled(attributes) &&
            !isFilesDownloadCompleted(attributes)
        );
    }, [activeCollectionID, filesDownloadProgressAttributesList]);

    useEffect(() => {
        if (shouldHide) return;

        setPhotoListHeader({
            item:
                mode != "people" ? (
                    <CollectionHeader
                        {...{
                            activeCollection,
                            setActiveCollectionID,
                            setFilesDownloadProgressAttributesCreator,
                            isActiveCollectionDownloadInProgress,
                            onRemotePull,
                        }}
                        collectionSummary={toShowCollectionSummaries.get(
                            activeCollectionID,
                        )}
                        onCollectionShare={showCollectionShare}
                        onCollectionCast={showCollectionCast}
                    />
                ) : activePerson ? (
                    <PeopleHeader
                        person={activePerson}
                        {...{ onSelectPerson, people }}
                    />
                ) : (
                    <></>
                ),
            tag: "header",
            height: 68,
        });
    }, [
        shouldHide,
        mode,
        toShowCollectionSummaries,
        activeCollectionID,
        isActiveCollectionDownloadInProgress,
        activePerson,
        showCollectionShare,
        showCollectionCast,
        // TODO-Cluster
        // This causes a loop since it is an array dep
        // people,
    ]);

    if (shouldBeHidden) {
        return <></>;
    }

    return (
        <>
            <GalleryBarImpl
                {...{
                    mode,
                    onChangeMode,
                    activeCollectionID,
                    people,
                    activePerson,
                    onSelectPerson,
                    collectionsSortBy,
                }}
                onSelectCollectionID={setActiveCollectionID}
                onChangeCollectionsSortBy={setCollectionsSortBy}
                onShowAllAlbums={showAllAlbums}
                collectionSummaries={sortedCollectionSummaries.filter(
                    (cs) => !cs.attributes.has("hideFromCollectionBar"),
                )}
            />

            <AllAlbums
                {...allAlbumsVisibilityProps}
                collectionSummaries={sortedCollectionSummaries.filter(
                    (cs) => !cs.attributes.has("system"),
                )}
                onSelectCollectionID={setActiveCollectionID}
                onChangeCollectionsSortBy={setCollectionsSortBy}
                collectionsSortBy={collectionsSortBy}
                isInHiddenSection={mode == "hidden-albums"}
            />
            <CollectionShare
                {...collectionShareVisibilityProps}
                collectionSummary={toShowCollectionSummaries.get(
                    activeCollectionID,
                )}
                collection={activeCollection}
                {...{
                    user,
                    emailByUserID,
                    shareSuggestionEmails,
                    setBlockingLoad,
                    onRemotePull,
                }}
            />
            <AlbumCastDialog
                {...collectionCastVisibilityProps}
                collection={activeCollection}
            />
        </>
    );
};

/**
 * A hook that maintains the collections sort order both as in-memory and local
 * storage state.
 */
const useCollectionsSortByLocalState = (initialValue: CollectionsSortBy) => {
    const key = "collectionsSortBy";

    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        const value = localStorage.getItem(key);
        if (value) {
            if (includes(collectionsSortBy, value)) setValue(value);
        } else {
            // Older versions of this code used to store the value in a
            // different place and format. Migrate if needed.
            //
            // This migration added Sep 2024, can be removed after a bit (esp
            // since it effectively runs on each app start). (tag: Migration).
            const oldData = getData("collectionSortBy");
            if (oldData) {
                let newValue: CollectionsSortBy | undefined;
                switch (oldData.value) {
                    case 0:
                        newValue = "name";
                        break;
                    case 1:
                        newValue = "creation-time-asc";
                        break;
                    case 2:
                        newValue = "updation-time-desc";
                        break;
                }
                if (newValue) {
                    localStorage.setItem(key, newValue);
                    setValue(newValue);
                }
                removeData("collectionSortBy");
            }
        }
    }, []);

    const setter = (value: CollectionsSortBy) => {
        localStorage.setItem(key, value);
        setValue(value);
    };

    return [value, setter] as const;
};
