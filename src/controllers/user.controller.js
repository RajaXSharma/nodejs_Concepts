import { json } from "express";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    } catch (error) {
        throw new apiError(500, "something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, fullName, userName, password } = req.body;

    if (
        [email, fullName, userName, password].some(
            (fields) => fields?.trim === ""
        )
    ) {
        throw new apiError(400, "please fill all fields");
    }

    const userExist = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (userExist) {
        throw new apiError(409, "user already exist");
    }

    const avatarLocalPath = await req.files?.avatar[0]?.path;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "requere avatar image");
    }
    const cloudinaryAvatar = await uploadOnCloudinary(avatarLocalPath);
    const cloudinaryCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!cloudinaryAvatar) {
        throw new apiError(400, "requre avatar image");
    }

    const user = await User.create({
        fullName,
        avatar: cloudinaryAvatar.url,
        coverImage: cloudinaryCoverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase(),
    });

    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!isUserCreated) {
        throw new apiError(500, "something went wrong while creating the user");
    }

    return res
        .status(201)
        .json(
            new apiResponse(200, isUserCreated, "user is created succesfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email && !password) {
        throw new apiError(400, "email is requited");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new apiError(404, "no user found with this email");
    }

    const passwordCheck = await user.isPasswordCorrect(password);

    if (!passwordCheck) {
        throw new apiError(401, "invalid credentials");
    }

    const { refreshToken, accessToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const userLoggedIn = User.findById(user._id);
    // .select("-password -refreshToken")
    // .lean();

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new apiResponse(
                200,
                {
                    data: accessToken,
                    refreshToken,
                    // userLoggedIn, giving error
                },
                "user logged in successfully"
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new apiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies.accessToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new apiError(401, "unautherized token");
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = User.findById(decodedToken._id);

        if (!user) {
            throw new apiError(401, "Invalid refreshToken");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "refresh token is expired");
        }

        const { accessToken, newRefreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);

        return (
            res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options),
            json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "access token refreshed"
                )
            )
        );
    } catch (error) {
        console.log(error, error.message);
    }
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) throw new apiError(400, "invalid old password");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new apiResponse(200, {}, "password updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    return res
        .status(200)
        .json(200, user, "current user details successfully fetched");
});

const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;
    if (!email || !fullName) {
        throw new apiError(400, "required all details");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new apiResponse(200, user, "user details updated succesfully"));
});

//todo : update avatar and coverImage

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = await req.file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "file was not uploaded try again");
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarUpload.url) {
        throw new apiError(400, "cloudnary avatar url not found try again");
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { avatar: avatarUpload.url },
        },
        {
            new: true,
        }
    ).select("-password");

    return res.status(200).json(new apiResponse(200, user, "updated avater"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = await req.file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "file was not uploaded try again");
    }

    const coverImageUpload = await uploadOnCloudinary(avatarLocalPath);

    if (!coverImageUpload.url) {
        throw new apiError(
            400,
            "cloudnary cover image url not found try again"
        );
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: coverImageUpload.url },
        },
        {
            new: true,
        }
    ).select("-password");

    return res.status(200).json(new apiResponse(200, user, "updated avater"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username.trim()) {
        throw new apiError(400, "username not found");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            subscriberCount: {
                size: "$subscribers",
            },
            channelSubscribedToCount: {
                size: "$subscribedTo",
            },
        },
        {
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false,
                },
            },
        },
        {
            $project: {
                fullName:1,
                userName:1,
                email:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
            }
        }
    ]);
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUser,
    updateUserAccountDetails,
};
